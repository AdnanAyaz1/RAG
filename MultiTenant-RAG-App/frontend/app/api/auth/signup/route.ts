import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const body = await request.json();

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const data = await res.json();
    return NextResponse.json({ error: data.error || 'Signup failed' }, { status: res.status });
  }

  return NextResponse.json(await res.json());
}