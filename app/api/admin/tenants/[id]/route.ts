export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { updateTenant, deleteTenant } from '@/lib/tenantsStore';
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
      return NextResponse.json({ success: false, error: 'Invalid Tenant ID' }, { status: 400 });
    }

    const body = await request.json();
    const updated = await updateTenant(id, body, adminId);

    if (!updated) {
      return NextResponse.json({ success: false, error: 'Tenant record not found or access denied' }, { status: 404 });
    }

    return NextResponse.json({ success: true, tenant: updated });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update tenant record' },
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
      return NextResponse.json({ success: false, error: 'Invalid Tenant ID' }, { status: 400 });
    }

    const deleted = await deleteTenant(id, adminId);
    if (!deleted) {
      return NextResponse.json({ success: false, error: 'Tenant record not found or access denied' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Tenant record deleted successfully' });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete tenant record' },
      { status: 500 }
    );
  }
}
