export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getBillingTypesList, createBillingType } from '@/lib/billingsStore';
import { getAdminIdFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const adminId = await getAdminIdFromRequest(request);
    const billingTypes = await getBillingTypesList(adminId);
    return NextResponse.json({ success: true, billingTypes });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch billing types' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminId = await getAdminIdFromRequest(request);
    const body = await request.json();
    const { 
      name, 
      description, 
      due_date_type, 
      due_date_value, 
      late_fee_type, 
      late_fee_amount, 
      grace_period_days, 
      tax_percentage, 
      transfer_fee, 
      has_meter_reading,
      has_electricity,
      has_water,
      rate_per_unit,
      electricity_rate_per_unit,
      water_rate_per_unit,
      allow_partial, 
      auto_generate 
    } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, error: 'Billing type name is required.' },
        { status: 400 }
      );
    }

    const created = await createBillingType({
      admin_id: adminId,
      name: name.trim(),
      description: description ? description.trim() : '',
      due_date_type: due_date_type || 'days_after_posting',
      due_date_value: due_date_value ? Number(due_date_value) : 15,
      late_fee_type: late_fee_type || 'none',
      late_fee_amount: late_fee_amount ? Number(late_fee_amount) : 0,
      grace_period_days: grace_period_days ? Number(grace_period_days) : 0,
      tax_percentage: tax_percentage ? Number(tax_percentage) : 0,
      transfer_fee: transfer_fee ? Number(transfer_fee) : 0,
      has_meter_reading: Boolean(has_electricity || has_water || has_meter_reading),
      has_electricity: Boolean(has_electricity),
      has_water: Boolean(has_water),
      rate_per_unit: rate_per_unit ? Number(rate_per_unit) : 0,
      electricity_rate_per_unit: electricity_rate_per_unit ? Number(electricity_rate_per_unit) : 12.50,
      water_rate_per_unit: water_rate_per_unit ? Number(water_rate_per_unit) : 45.00,
      allow_partial: Boolean(allow_partial),
      auto_generate: Boolean(auto_generate)
    });

    return NextResponse.json({ success: true, billingType: created }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create billing type' },
      { status: 500 }
    );
  }
}
