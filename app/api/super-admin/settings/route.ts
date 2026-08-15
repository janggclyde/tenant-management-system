export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSystemSettings, updateSystemSettings } from '@/lib/settingsStore';

export async function GET() {
  try {
    const settings = await getSystemSettings();
    return NextResponse.json({ success: true, settings });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch global settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate email format if provided
    if (body.default_sender_email && body.default_sender_email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(body.default_sender_email.trim())) {
        return NextResponse.json(
          { success: false, error: 'Default sender email format is invalid.' },
          { status: 400 }
        );
      }
    }

    if (body.support_email && body.support_email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(body.support_email.trim())) {
        return NextResponse.json(
          { success: false, error: 'Support email format is invalid.' },
          { status: 400 }
        );
      }
    }

    const updated = await updateSystemSettings(body);

    return NextResponse.json({
      success: true,
      settings: updated,
      message: 'Global platform settings and notification configurations saved successfully.'
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update global settings' },
      { status: 500 }
    );
  }
}
