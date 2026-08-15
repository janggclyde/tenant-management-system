export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { sendBillingPostedNotification } from '@/lib/email';
import { getBillingById } from '@/lib/billingsStore';
import { getAdminIdFromRequest } from '@/lib/auth';

export async function POST(
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
      return NextResponse.json({ success: false, error: 'Billing record not found or access denied' }, { status: 404 });
    }

    const result = await sendBillingPostedNotification(id);
    return NextResponse.json({
      success: true,
      message: `Statement of account and PDF invoice dispatched to ${result.recipient}.`,
      result
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to dispatch statement email' },
      { status: 500 }
    );
  }
}
