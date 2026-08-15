export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { testEmailSettings, getAdminSettings } from '@/lib/settingsStore';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const recipient = body.recipient;
    const adminSettings = await getAdminSettings(2);

    if (!recipient || !recipient.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'Please provide a valid recipient email address.' },
        { status: 400 }
      );
    }

    const result = await testEmailSettings(
      recipient.trim(),
      adminSettings.company_name ? `${adminSettings.company_name}` : undefined
    );

    return NextResponse.json({
      success: true,
      message: result.message,
      result
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to dispatch test email.' },
      { status: 500 }
    );
  }
}
