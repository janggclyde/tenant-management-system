export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getBillingById } from '@/lib/billingsStore';
import { generateBillPDF } from '@/lib/pdf';
import { getSystemSettings } from '@/lib/settingsStore';
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

    const billing: any = await getBillingById(id, adminId);
    if (!billing) {
      return NextResponse.json({ success: false, error: 'Billing record not found or access denied' }, { status: 404 });
    }

    const settings = await getSystemSettings();
    const tenantEmail = billing.tenant_email || billing.Tenant?.User?.email || '';

    const pdfBuffer = await generateBillPDF({
      id: billing.id,
      invoice_no: billing.reference_number || `IN-${String(billing.id).padStart(5, '0')}`,
      billing_type_name: billing.billing_type_name || 'Monthly Rent',
      tenant_name: billing.tenant_name || 'Valued Tenant',
      tenant_email: tenantEmail,
      unit_number: billing.unit_number || `Unit #${billing.unit_id}`,
      building_name: billing.building_name || 'Main Apartment Building',
      base_amount: Number(billing.base_amount || billing.amount),
      tax_percentage: billing.tax_percentage,
      tax_amount: billing.tax_amount,
      transfer_fee: billing.transfer_fee,
      late_fee_applied: billing.late_fee_applied,
      meter_readings_json: billing.meter_readings_json,
      extra_charges_json: billing.extra_charges_json,
      amount: Number(billing.amount),
      due_date: billing.due_date,
      billing_cycle: billing.billing_cycle || billing.BillingType?.frequency || 'monthly',
      status: billing.status || 'posted',
      created_at: billing.created_at,
      platform_name: settings.platform_name,
      support_email: settings.support_email,
      support_phone: settings.support_phone
    });

    const invRef = billing.reference_number || `IN-${String(billing.id).padStart(5, '0')}`;
    const filename = `Statement_Invoice_${invRef}_${billing.unit_number ? billing.unit_number.replace(/\s+/g, '_') : 'unit'}.pdf`;

    return new NextResponse(pdfBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${filename}"`
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate statement PDF' },
      { status: 500 }
    );
  }
}
