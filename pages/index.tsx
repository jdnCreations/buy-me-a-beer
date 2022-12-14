import { GetServerSideProps } from 'next';
import Head from 'next/head';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { DONATION_IN_CENTS, MAX_DONATION_IN_CENTS } from '../config';
import { Record } from '../types';

export default function Home({ donations }: { donations: Array<Record> }) {
  const router = useRouter();

  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');

  const presets = [1, 3, 5];

  async function handleCheckout() {
    setError(null);
    const response = await fetch('/api/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        quantity,
        name,
        message,
      }),
    });

    const res = await response.json();

    if (res.error) {
      setError(res.error);
    }

    if (res.url) {
      router.push(res.url);
    }
  }

  return (
    <div>
      <Head>
        <title>Buy me a Beer</title>
        <meta name='description' content='Generated by create next app' />
        <link rel='icon' href='/favicon.ico' />
      </Head>

      <main className='flex max-w-2xl m-auto gap-6 my-6'>
        <div className='flex-1'>
          <h2>Previous Donations</h2>
          {donations.map((donation) => (
            <div
              className='flex gap-2 text-center m-1 shadow rounded'
              key={donation.id}
            >
              <p className='w-[80px] bg-green-600 rounded-l h-full text-white font-medium'>
                ${donation.fields.amount}
              </p>
              <p className='font-bold'>{donation.fields.name}</p>
              <p> -{donation.fields.message}</p>
            </div>
          ))}
        </div>

        <div>
          <h1>Buy me a Beer</h1>
          {error && <div>{error}</div>}
          <div className='flex items-center full-w mb-2'>
            <span className='mr-2'>
              <Image src='/beer.svg' width='50' height='100' alt='beer' />
            </span>
            <span className='mr-2'>X</span>
            {presets.map((preset) => (
              <button
                className='bg-blue-500 text-white px-4 py-2 rounded mr-2'
                key={preset}
                onClick={() => setQuantity(preset)}
              >
                {preset}
              </button>
            ))}

            <input
              className='shadow rounded w-full border border-blue-500 p-2'
              type='number'
              value={quantity}
              onChange={(event) => setQuantity(parseFloat(event?.target.value))}
              min={1}
              max={MAX_DONATION_IN_CENTS / DONATION_IN_CENTS}
            />
          </div>
          <div className='mb-2 w-full'>
            <label className='block' htmlFor='name'>
              Name
            </label>
            <input
              className='shadow rounded w-full border border-blue-500 p-2'
              type='text'
              id='name'
              onChange={(e) => setName(e.target.value)}
              value={name}
              placeholder='Jordan'
            />
          </div>

          <div className='mb-2 w-full'>
            <label htmlFor='message'>Message (Optional)</label>
            <textarea
              className='shadow rounded w-full border border-blue-500 p-2'
              id='message'
              onChange={(e) => setMessage(e.target.value)}
              value={message}
              placeholder='Thank you'
            />
          </div>

          <button
            onClick={handleCheckout}
            className='bg-blue-500 rounded shadow px-4 py-2 text-white'
          >
            Donate ${quantity * (DONATION_IN_CENTS / 100)}
          </button>
        </div>
      </main>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  // get protocol from request
  const protocol = context.req.headers['x-forwarded-proto'] || 'http';

  const response = await fetch(
    `${protocol}://${context.req.headers.host}/api/donations`
  );

  const donations = await response.json();

  return {
    props: {
      donations,
    },
  };
};
