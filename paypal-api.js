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
