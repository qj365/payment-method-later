import 'dotenv/config';
import express from 'express';
import {
    createSetupToken,
    createPaymentToken,
    listPaymentMethods,
    createPayPalSetupToken,
    deletePaymentMethodByToken,
    createOrder,
} from './paypal-api.js';

const { PORT = 8888 } = process.env;
const app = express();

app.set('views', './client');
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.json());

// Render checkout page
app.get('/checkout', (req, res) => {
    res.render('checkout', {
        clientId: process.env.PAYPAL_CLIENT_ID,
    });
});

// Create setup token
app.post('/api/vault/token', async (req, res) => {
    try {
        const { customerId } = req.body;
        const response = await createSetupToken(customerId);
        res.json(response);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// Create payment token from a setup token
app.post('/api/vault/payment-token', async (req, res) => {
    try {
        const { vaultSetupToken } = req.body;
        const response = await createPaymentToken(vaultSetupToken);

        // Here you would typically save these tokens in your database
        const paymentMethodToken = response.id;
        const customerId = response.customer.id;

        await saveToDatabase(paymentMethodToken, customerId);

        res.json(response);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// Placeholder for database save function
const saveToDatabase = async (paymentMethodToken, customerId) => {
    // TODO: Implement your database logic here
    console.log('Saved tokens:', { paymentMethodToken, customerId });
};

// Add this new endpoint
app.get('/api/vault/payment-methods/:customerId', async (req, res) => {
    try {
        const { customerId } = req.params;
        const response = await listPaymentMethods(customerId);
        res.json(response);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add this new endpoint for PayPal setup token
app.post('/api/vault/paypal-token', async (req, res) => {
    try {
        const { customerId } = req.body;
        const response = await createPayPalSetupToken(customerId);
        res.json(response);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add this new endpoint to handle payment method deletion
app.delete('/api/vault/payment-methods/:token', async (req, res) => {
    try {
        const { token } = req.params;
        await deletePaymentMethodByToken(token);
        res.json({
            success: true,
            message: 'Payment method deleted successfully',
        });
    } catch (error) {
        console.error('Error in delete payment method:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to delete payment method',
        });
    }
});

// Add this new endpoint to handle orders with stored payment methods
app.post('/api/orders/create-with-token', async (req, res) => {
    try {
        const { paymentMethodToken, amount } = req.body;
        const response = await createOrder(paymentMethodToken, amount);
        res.json(response);
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to create order',
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server listening at http://localhost:${PORT}/`);
});
