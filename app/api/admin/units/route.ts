export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getUnitsList, createUnit } from '@/lib/propertiesStore';
import { getAdminIdFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const adminId = await getAdminIdFromRequest(request);
    const units = await getUnitsList(adminId);
    return NextResponse.json({ success: true, units });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch units' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminId = await getAdminIdFromRequest(request);
    const body = await request.json();
    const { building_id, unit_number, status, monthly_rent } = body;

    if (!building_id) {
      return NextResponse.json(
        { success: false, error: 'Building selection is required.' },
        { status: 400 }
      );
    }

    if (!unit_number || !unit_number.trim()) {
      return NextResponse.json(
        { success: false, error: 'Unit number / designation is required.' },
        { status: 400 }
      );
    }

    const unit = await createUnit({
      admin_id: adminId,
      building_id: Number(building_id),
      unit_number: unit_number.trim(),
      status: status || 'vacant',
      monthly_rent: monthly_rent ? Number(monthly_rent) : 15000.00
    });

    return NextResponse.json({ success: true, unit }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create unit' },
      { status: 500 }
    );
  }
}
