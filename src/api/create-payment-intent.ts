import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

const stripe = new Stripe('sk_live_...CxRr', {
  apiVersion: '2024-06-20',
});

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  const { amount } = request.body;

  if (!amount) {
    return response.status(400).json({ error: 'Amount is required' });
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
    });

    return response.status(200).json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    return response.status(500).json({ error: (error as any).message || 'Something went wrong' });
  }
}
