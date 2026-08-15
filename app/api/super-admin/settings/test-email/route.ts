export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { testEmailSettings } from '@/lib/settingsStore';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { recipient } = body;

    if (!recipient || !recipient.trim()) {
      return NextResponse.json(
        { success: false, error: 'Recipient email address is required for testing.' },
        { status: 400 }
      );
    }

    const result = await testEmailSettings(recipient.trim());
    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to dispatch test email' },
      { status: 500 }
    );
  }
}
