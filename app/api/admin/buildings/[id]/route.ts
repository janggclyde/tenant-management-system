export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { updateBuilding, deleteBuilding } from '@/lib/propertiesStore';
import { getAdminIdFromRequest } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminId = await getAdminIdFromRequest(request);
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id, 10);
    if (isNaN(id)) {
      return NextResponse.json({ success: false, error: 'Invalid Building ID' }, { status: 400 });
    }

    const body = await request.json();
    const updated = await updateBuilding(id, body, adminId);

    if (!updated) {
      return NextResponse.json({ success: false, error: 'Building not found or access denied' }, { status: 404 });
    }

    return NextResponse.json({ success: true, building: updated });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update building' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminId = await getAdminIdFromRequest(request);
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id, 10);
    if (isNaN(id)) {
      return NextResponse.json({ success: false, error: 'Invalid Building ID' }, { status: 400 });
    }

    const deleted = await deleteBuilding(id, adminId);
    if (!deleted) {
      return NextResponse.json({ success: false, error: 'Building not found or access denied' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Building deleted successfully' });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete building' },
      { status: 500 }
    );
  }
}
