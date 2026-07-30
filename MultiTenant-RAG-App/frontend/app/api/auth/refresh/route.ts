import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const body = await request.json();
  const refreshToken = body.refreshToken;

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) {
    return NextResponse.json({ error: 'Refresh failed' }, { status: res.status });
  }

  return NextResponse.json(await res.json(), {
    headers: {
      'Set-Cookie': `access_token=${(await res.json()).accessToken}; HttpOnly; Path=/; Max-Age=900`,
    },
  });
}