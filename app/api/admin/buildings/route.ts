export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getBuildingsList, createBuilding } from '@/lib/propertiesStore';
import { getAdminIdFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const adminId = await getAdminIdFromRequest(request);
    const buildings = await getBuildingsList(adminId);
    return NextResponse.json({ success: true, buildings });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch buildings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminId = await getAdminIdFromRequest(request);
    const body = await request.json();
    const { name, address } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, error: 'Building name is required.' },
        { status: 400 }
      );
    }

    if (!address || !address.trim()) {
      return NextResponse.json(
        { success: false, error: 'Building address is required.' },
        { status: 400 }
      );
    }

    const building = await createBuilding({
      admin_id: adminId,
      name: name.trim(),
      address: address.trim()
    });

    return NextResponse.json({ success: true, building }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create building' },
      { status: 500 }
    );
  }
}
