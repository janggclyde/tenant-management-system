export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { testHitPaySettings } from '@/lib/settingsStore';

export async function POST() {
  try {
    const result = await testHitPaySettings();
    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'HitPay connection test failed' },
      { status: 500 }
    );
  }
}
