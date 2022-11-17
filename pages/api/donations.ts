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
import { AirtableRecord } from '../../types';

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
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const response = await fetch(
    `https://api.airtable.com/v0/${AIRTABLE_APP_ID}/donations?maxRecords=3&view=Grid%20view`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  );
  const data = (await response.json()) as AirtableRecord;

  return res.status(200).json(data.records);
}
