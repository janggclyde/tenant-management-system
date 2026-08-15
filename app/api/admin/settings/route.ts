export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getAdminSettings, updateAdminSettings } from '@/lib/settingsStore';
import { getAdminIdFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const adminId = await getAdminIdFromRequest(request);
    const settings = await getAdminSettings(adminId);
    return NextResponse.json({ success: true, settings });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch admin settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const adminId = await getAdminIdFromRequest(request);
    const body = await request.json();
    const updated = await updateAdminSettings(adminId, body);

    return NextResponse.json({
      success: true,
      settings: updated,
      message: 'Property management preferences saved successfully.'
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update admin settings' },
      { status: 500 }
    );
  }
}
