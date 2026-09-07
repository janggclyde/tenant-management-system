export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getBillingById, updateBilling, deleteBilling } from '@/lib/billingsStore';
import { sendBillingPostedNotification, isValidTenantEmail } from '@/lib/email';
import { getAdminIdFromRequest } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminId = await getAdminIdFromRequest(request);
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id, 10);
    if (isNaN(id)) {
      return NextResponse.json({ success: false, error: 'Invalid Billing ID' }, { status: 400 });
    }

    const billing = await getBillingById(id, adminId);
    if (!billing) {
      return NextResponse.json({ success: false, error: 'Billing not found or access denied' }, { status: 404 });
    }

    return NextResponse.json({ success: true, billing });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch billing' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminId = await getAdminIdFromRequest(request);
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id, 10);
    if (isNaN(id)) {
      return NextResponse.json({ success: false, error: 'Invalid Billing ID' }, { status: 400 });
    }

    const body = await request.json();
    const updated = await updateBilling(id, body, adminId);

    if (!updated) {
      return NextResponse.json({ success: false, error: 'Billing record not found or access denied' }, { status: 404 });
    }

    // When a billing statement is published / posted, dispatch email if tenant has a valid email;
    // if tenant has no email, no need to send an email, just post the bill directly.
    let emailNotification = null;
    if (body.status === 'posted') {
      const tenantEmail = updated.tenant_email || (await getBillingById(id, adminId))?.tenant_email;
      if (isValidTenantEmail(tenantEmail)) {
        try {
          emailNotification = await sendBillingPostedNotification(id);
        } catch (err: any) {
          console.warn(`[Billing API] Warning dispatching email for billing #${id}:`, err.message);
          emailNotification = { success: false, error: err.message };
        }
      } else {
        // Tenant has no email: post the bill directly without dispatching email
        emailNotification = {
          success: false,
          skipped: true,
          reason: 'Tenant has no email address. Bill posted directly.'
        };
      }
    }

    return NextResponse.json({
      success: true,
      billing: updated,
      emailNotification
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update billing record' },
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
      return NextResponse.json({ success: false, error: 'Invalid Billing ID' }, { status: 400 });
    }

    const deleted = await deleteBilling(id, adminId);
    if (!deleted) {
      return NextResponse.json({ success: false, error: 'Billing record not found or access denied' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Billing deleted successfully' });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete billing record' },
      { status: 500 }
    );
  }
}
