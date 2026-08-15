export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { updateBillingType, deleteBillingType } from '@/lib/billingsStore';
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
      return NextResponse.json({ success: false, error: 'Invalid Billing Type ID' }, { status: 400 });
    }

    const body = await request.json();
    const updated = await updateBillingType(id, body, adminId);

    if (!updated) {
      return NextResponse.json({ success: false, error: 'Billing type not found or access denied' }, { status: 404 });
    }

    return NextResponse.json({ success: true, billingType: updated });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update billing type' },
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
      return NextResponse.json({ success: false, error: 'Invalid Billing Type ID' }, { status: 400 });
    }

    const deleted = await deleteBillingType(id, adminId);
    if (!deleted) {
      return NextResponse.json({ success: false, error: 'Billing type not found or access denied' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Billing type deleted successfully' });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete billing type' },
      { status: 500 }
    );
  }
}
