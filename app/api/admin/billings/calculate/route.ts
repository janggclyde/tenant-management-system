export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { calculateServerSideBilling } from '@/lib/billingsStore';
import { getAdminIdFromRequest } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const adminId = await getAdminIdFromRequest(request);
    const body = await request.json();
    const { billing_type_id, base_amount, posting_date, custom_due_date, custom_late_fee, meter_readings } = body;

    if (!billing_type_id) {
      return NextResponse.json(
        { success: false, error: 'Billing type ID is required for server-side calculations.' },
        { status: 400 }
      );
    }

    if (isNaN(Number(base_amount)) || Number(base_amount) < 0) {
      return NextResponse.json(
        { success: false, error: 'Base amount must be a valid positive number.' },
        { status: 400 }
      );
    }

    const calculated = await calculateServerSideBilling({
      admin_id: adminId,
      billing_type_id: Number(billing_type_id),
      base_amount: Number(base_amount),
      posting_date: posting_date ? String(posting_date) : undefined,
      custom_due_date: custom_due_date ? String(custom_due_date) : undefined,
      custom_late_fee: custom_late_fee ? Number(custom_late_fee) : undefined,
      meter_readings: meter_readings || undefined
    });

    return NextResponse.json({ success: true, calculation: calculated });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Server-side calculation error' },
      { status: 500 }
    );
  }
}
