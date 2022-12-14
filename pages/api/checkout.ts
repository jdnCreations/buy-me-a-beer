import { DONATION_IN_CENTS } from './../../config';
// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';

import Stripe from 'stripe';
import { STRIPE_API_KEY } from '../../config';

const stripe = new Stripe(STRIPE_API_KEY, {
  apiVersion: '2022-08-01',
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const quantity = req.body.quantity || 1;
  const message = req.body.message || '';
  const name = req.body.name || 'Anonymous';

  try {
    const session = await stripe.checkout.sessions.create({
      metadata: {
        name,
        message,
      },
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'aud',
            product_data: {
              name: 'Donation',
            },
            unit_amount: DONATION_IN_CENTS,
          },
          quantity,
        },
      ],
      success_url: `${req.headers.origin}/thank-you`,
      cancel_url: `${req.headers.origin}/cancel`,
    });

    const url = session.url;

    if (url) {
      return res.status(200).send({ url });
    }

    return res.status(500).json({ error: 'Something went wrong' });
  } catch (error) {
    console.log('Error creating session + ', error);
    return res.status(500).json({ error: 'Something went wrong' });
  }
}
