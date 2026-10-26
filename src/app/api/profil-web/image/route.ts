import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const target = searchParams.get('target') || 'bupati'; // 'bupati' | 'wakil'

  const defaultLocalPath = `/img/${target === 'bupati' ? 'dummy_pejabat_1' : 'dummy_pejabat_2'}.png`;
  return NextResponse.redirect(new URL(defaultLocalPath, request.url));
}
