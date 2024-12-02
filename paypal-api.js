import 'dotenv/config';

const PAYPAL_API_BASE = 'https://api-m.sandbox.paypal.com';

const getAccessToken = async () => {
    try {
        const auth = Buffer.from(
            `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
        ).toString('base64');

        const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
            method: 'POST',
            body: 'grant_type=client_credentials',
            headers: {
                Authorization: `Basic ${auth}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });

        const data = await response.json();
        return data.access_token;
    } catch (error) {
        console.error('Failed to get access token:', error);
        throw error;
    }
};

export const createSetupToken = async customerId => {
    const accessToken = await getAccessToken();

    const response = await fetch(`${PAYPAL_API_BASE}/v3/vault/setup-tokens`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'PayPal-Request-Id': Date.now().toString(),
        },
        body: JSON.stringify({
            payment_source: {
                card: {},
            },
            customer: {
                id: customerId,
            },
        }),
    });

    return response.json();
};

export const createPaymentToken = async setupToken => {
    const accessToken = await getAccessToken();

    const response = await fetch(`${PAYPAL_API_BASE}/v3/vault/payment-tokens`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'PayPal-Request-Id': Date.now().toString(),
        },
        body: JSON.stringify({
            payment_source: {
                token: {
                    id: setupToken,
                    type: 'SETUP_TOKEN',
                },
            },
        }),
    });

    return response.json();
};

export const listPaymentMethods = async customerId => {
    const accessToken = await getAccessToken();

    const response = await fetch(
        `${PAYPAL_API_BASE}/v3/vault/payment-tokens?customer_id=${customerId}`,
        {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        }
    );

    if (!response.ok) {
        throw new Error(
            `Failed to fetch payment methods: ${response.statusText}`
        );
    }

    return response.json();
};

export const createPayPalSetupToken = async customerId => {
    const accessToken = await getAccessToken();

    const response = await fetch(`${PAYPAL_API_BASE}/v3/vault/setup-tokens`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'PayPal-Request-Id': Date.now().toString(),
        },
        body: JSON.stringify({
            payment_source: {
                paypal: {
                    description: 'Save PayPal for future payments',
                    permit_multiple_payment_tokens: false,
                    usage_pattern: 'IMMEDIATE',
                    usage_type: 'MERCHANT',
                    customer_type: 'CONSUMER',
                    experience_context: {
                        payment_method_preference: 'IMMEDIATE_PAYMENT_REQUIRED',
                        brand_name: 'Bettamall',
                        locale: 'en-US',
                        return_url: `http://localhost:${process.env.PORT}/checkout`,
                        cancel_url: `http://localhost:${process.env.PORT}/checkout`,
                    },
                },
            },
            customer: {
                id: customerId,
            },
        }),
    });

    if (!response.ok) {
        throw new Error(
            `Failed to create PayPal setup token: ${response.statusText}`
        );
    }

    const data = await response.json();
    console.log(data);
    return data;
};

export const deletePaymentMethod = async tokenId => {
    const accessToken = await getAccessToken();

    const response = await fetch(
        `${PAYPAL_API_BASE}/v3/vault/payment-tokens/${tokenId}`,
        {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        }
    );

    if (!response.ok) {
        throw new Error(
            `Failed to delete payment method: ${response.statusText}`
        );
    }

    return true;
};

export async function deletePaymentMethodByToken(token) {
    try {
        const accessToken = await getAccessToken();
        const response = await fetch(
            `${PAYPAL_API_BASE}/v3/vault/payment-tokens/${token}`,
            {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(
                errorData.message || 'Failed to delete payment method'
            );
        }

        return true; // Successfully deleted
    } catch (error) {
        console.error('Error deleting payment method:', error);
        throw error;
    }
}
