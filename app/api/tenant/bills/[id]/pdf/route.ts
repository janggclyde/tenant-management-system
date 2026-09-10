export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { Billing, BillingType, Unit, Building } from '@/db/models';
import { getTenantFromRequest } from '@/lib/tenantAuth';
import { generateBillPDF } from '@/lib/pdf';
import { getSystemSettings } from '@/lib/settingsStore';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getTenantFromRequest(request);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized or tenant profile not found' }, { status: 401 });
    }

    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id, 10);
    if (isNaN(id)) {
      return NextResponse.json({ success: false, error: 'Invalid Billing ID' }, { status: 400 });
    }

    const billingRecord = await Billing.findOne({
      where: { id, tenant_id: session.tenantId },
      include: [
        { model: BillingType },
        { model: Unit, include: [{ model: Building }] }
      ]
    });

    if (!billingRecord) {
      return NextResponse.json({ success: false, error: 'Billing record not found or access denied' }, { status: 404 });
    }

    const billing: any = billingRecord.get({ plain: true });
    const settings = await getSystemSettings();

    const unitRent = Number(billing.Unit?.monthly_rent || session.monthlyRent || 0);
    const electricityAmt = Number(billing.meter_readings_json?.electricity?.amount || 0);
    const waterAmt = Number(billing.meter_readings_json?.water?.amount || 0);
    const submetersTotal = electricityAmt + waterAmt;
    const taxAmt = Number(billing.tax_amount || 0);
    const transferAmt = Number(billing.transfer_fee || 0);
    const lateAmt = Number(billing.late_fee_applied || 0);
    let extraChargesTotal = 0;
    if (Array.isArray(billing.extra_charges_json)) {
      extraChargesTotal = billing.extra_charges_json.reduce((acc: number, x: any) => acc + Number(x.amount || 0), 0);
    }
    let baseRent = unitRent;
    if (baseRent <= 0) {
      baseRent = Math.max(0, Number(billing.amount) - submetersTotal - extraChargesTotal - taxAmt - transferAmt - lateAmt);
    }

    const pdfBuffer = await generateBillPDF({
      id: billing.id,
      invoice_no: `INV-${String(billing.id).padStart(5, '0')}`,
      billing_type_name: billing.BillingType?.name || 'Rent & Utilities',
      tenant_name: session.tenantName,
      tenant_email: session.tenantEmail,
      unit_number: billing.Unit?.unit_number || session.unitNumber,
      building_name: billing.Unit?.Building?.name || session.buildingName,
      building_address: billing.Unit?.Building?.address || session.buildingAddress,
      base_amount: baseRent,
      tax_percentage: Number(billing.BillingType?.tax_percentage || 0),
      tax_amount: Number(billing.tax_amount || 0),
      transfer_fee: Number(billing.transfer_fee || 0),
      late_fee_applied: Number(billing.late_fee_applied || 0),
      meter_readings_json: billing.meter_readings_json,
      extra_charges_json: billing.extra_charges_json,
      amount: Number(billing.amount),
      due_date: billing.due_date,
      billing_cycle: billing.billing_cycle || billing.BillingType?.frequency || 'monthly',
      status: billing.status || 'posted',
      created_at: billing.createdAt,
      platform_name: settings.platform_name,
      support_email: settings.support_email,
      support_phone: settings.support_phone
    });

    const filename = `Statement_Invoice_INV-${String(billing.id).padStart(5, '0')}.pdf`;

    return new NextResponse(pdfBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${filename}"`
      }
    });

  } catch (error: any) {
    console.error('Tenant statement PDF error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to generate statement PDF' }, { status: 500 });
  }
}
