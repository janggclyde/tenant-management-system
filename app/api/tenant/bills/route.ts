export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { Billing, BillingType, Collection, AdvancedPayment, Unit } from '@/db/models';
import { getTenantFromRequest } from '@/lib/tenantAuth';

export async function GET(request: NextRequest) {
  try {
    const session = await getTenantFromRequest(request);

    if (!session) {
      return NextResponse.json({
        success: true,
        bills: [],
        summary: {
          totalOutstanding: 0,
          totalPaid: 0,
          countUnpaid: 0,
          countPaid: 0,
          advancedBalance: 0
        }
      });
    }

    const dbBills = await Billing.findAll({
      where: { tenant_id: session.tenantId },
      include: [
        { model: BillingType },
        { model: Collection },
        { model: Unit }
      ],
      order: [['id', 'DESC']]
    });

    const currentDate = new Date().toISOString().split('T')[0];
    let totalOutstanding = 0;
    let totalPaid = 0;
    let countUnpaid = 0;
    let countPaid = 0;

    const formattedBills = dbBills.map((b: any) => {
      const item = b.get({ plain: true });
      const collections = (item.Collections || []).map((c: any) => ({
        id: c.id,
        amount_paid: Number(c.amount_paid || 0),
        payment_method: c.payment_method,
        bank_name: c.bank_name || null,
        payment_reference: c.payment_reference || c.hitpay_reference || null,
        collected_date: c.collected_date || (c.createdAt ? String(c.createdAt).split('T')[0] : null),
        status: c.status || 'completed',
        receipt_url: c.receipt_url || null
      }));

      const amountPaid = collections.reduce((acc: number, c: any) => acc + c.amount_paid, 0);
      const totalAmount = Number(item.amount || 0);

      let status: 'paid' | 'overdue' | 'unpaid' = 'unpaid';
      if (amountPaid >= totalAmount) {
        status = 'paid';
        countPaid++;
        totalPaid += amountPaid;
      } else {
        if (item.due_date && item.due_date < currentDate) {
          status = 'overdue';
        }
        countUnpaid++;
        totalOutstanding += Math.max(0, totalAmount - amountPaid);
      }

      // Base rent is the unit's monthly rent
      const unitRent = Number(item.Unit?.monthly_rent || session.monthlyRent || 0);
      const electricityAmt = Number(item.meter_readings_json?.electricity?.amount || 0);
      const waterAmt = Number(item.meter_readings_json?.water?.amount || 0);
      const submetersTotal = electricityAmt + waterAmt;
      const taxAmt = Number(item.tax_amount || 0);
      const transferAmt = Number(item.transfer_fee || 0);
      const lateAmt = Number(item.late_fee_applied || 0);

      let extraChargesTotal = 0;
      if (Array.isArray(item.extra_charges_json)) {
        extraChargesTotal = item.extra_charges_json.reduce((acc: number, x: any) => acc + Number(x.amount || 0), 0);
      }

      // Base rent is unit rent, or total minus submeters and fees
      let baseRent = unitRent;
      if (baseRent <= 0) {
        baseRent = Math.max(0, totalAmount - submetersTotal - extraChargesTotal - taxAmt - transferAmt - lateAmt);
      }

      return {
        id: item.id,
        reference_number: `INV-${String(item.id).padStart(5, '0')}`,
        billing_type_name: item.BillingType?.name || 'Rent & Utilities',
        description: `${item.BillingType?.name || 'Rent & Utilities'} Statement`,
        billing_cycle: item.billing_cycle || item.BillingType?.frequency || 'monthly',
        base_amount: baseRent,
        tax_amount: taxAmt,
        transfer_fee: transferAmt,
        late_fee_applied: lateAmt,
        meter_readings: item.meter_readings_json || null,
        extra_charges: item.extra_charges_json || null,
        amount: totalAmount,
        amount_paid: amountPaid,
        remaining_balance: Math.max(0, totalAmount - amountPaid),
        due_date: item.due_date,
        status,
        collections,
        created_at: item.createdAt
      };
    });

    // Advance credit balance
    let advancedBalance = 0;
    try {
      const adv: any = await AdvancedPayment.findOne({ where: { tenant_id: session.tenantId } });
      if (adv) advancedBalance = Number(adv.remaining_balance || 0);
    } catch (e) {}

    return NextResponse.json({
      success: true,
      bills: formattedBills,
      summary: {
        totalOutstanding,
        totalPaid,
        countUnpaid,
        countPaid,
        advancedBalance
      }
    });

  } catch (err: any) {
    console.error('Tenant bills API error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Failed to fetch bills' }, { status: 500 });
  }
}
