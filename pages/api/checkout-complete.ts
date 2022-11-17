import {
  AIRTABLE_APP_ID,
  DONATION_IN_CENTS,
  STRIPE_WEBHOOK_SECRET,
} from '../../config';
// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';

import Stripe from 'stripe';
import { STRIPE_API_KEY } from '../../config';
import { buffer } from 'micro';

const stripe = new Stripe(STRIPE_API_KEY, {
  apiVersion: '2022-08-01',
});

async function insertToAirTable({
  name,
  message,
  amount,
}: {
  name: string;
  message: string;
  amount: number;
}) {
  const url = `https://api.airtable.com/v0/${AIRTABLE_APP_ID}/donations`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      records: [
        {
          fields: {
            name,
            message,
            amount,
          },
        },
      ],
    }),
  });

  return response.json();
}

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const signature = req.headers['stripe-signature'] as string;

  if (!signature) {
    return res.status(400).json({ error: 'Missing signature' });
  }

  let event: Stripe.Event;
  const buf = await buffer(req);

  try {
    event = stripe.webhooks.constructEvent(
      buf,
      signature,
      STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    console.error('Invalid signature', error);
    return res.status(400).json({ error: 'Invalid signature' });
  }

  if (event.type !== 'checkout.session.completed') {
    return res.status(400).json({ error: 'Invalid event type' });
  }

  const metadata = (
    event.data.object as {
      metadata: { name: string; message: string };
    }
  ).metadata;

  console.log({ metadata });

  const amount =
    (
      event.data.object as {
        amount_total: number;
      }
    ).amount_total / 100;

  await insertToAirTable({ ...metadata, amount });

  return res.status(200).json({ message: 'Success' });
}
