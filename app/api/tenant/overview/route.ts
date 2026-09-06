export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { Tenant, User, Contract, Unit, Building, Billing, BillingType, AdvancedPayment, syncDatabase } from '@/db/models';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await syncDatabase();
    const authUser = await getAuthUser(request);

    let tenantRecord: any = null;
    if (authUser && authUser.role === 'tenant') {
      tenantRecord = await Tenant.findOne({
        where: { user_id: authUser.id },
        include: [
          { model: User },
          { model: Contract, include: [{ model: Unit, include: [{ model: Building }] }] }
        ]
      });
    }

    // Fallback in case token is absent during dev/testing
    if (!tenantRecord) {
      tenantRecord = await Tenant.findOne({
        include: [
          { model: User },
          { model: Contract, include: [{ model: Unit, include: [{ model: Building }] }] }
        ]
      });
    }

    if (!tenantRecord) {
      return NextResponse.json({
        success: true,
        tenant: null,
        outstandingBill: null,
        recentBills: [],
        advancedBalance: 0
      });
    }

    const tJson = tenantRecord.get({ plain: true });
    const info = tJson.personal_info_json || {};
    const tenantName = info.first_name ? `${info.first_name} ${info.last_name || ''}`.trim() : (tJson.User?.email || `Tenant #${tJson.id}`);

    const contracts = tJson.Contracts || [];
    const latestContract = contracts[contracts.length - 1] || null;

    const unitNumber = latestContract?.Unit?.unit_number || 'Unassigned';
    const buildingName = latestContract?.Unit?.Building?.name || 'Property';
    const leaseExpiry = latestContract?.move_out_date || null;
    const documentUrl = latestContract?.document_url || null;

    // Fetch tenant's bills
    const bills = await Billing.findAll({
      where: { tenant_id: tJson.id },
      include: [{ model: BillingType }],
      order: [['due_date', 'DESC']],
      limit: 5
    });

    const formattedBills = bills.map((b: any) => {
      const bItem = b.get({ plain: true });
      return {
        id: bItem.id,
        billing_type_name: bItem.BillingType?.name || 'General Bill',
        amount: Number(bItem.amount),
        due_date: bItem.due_date,
        status: bItem.status
      };
    });

    // Check for outstanding (unpaid/overdue/posted) bill
    const outstanding = formattedBills.find((b: { status: string; [key: string]: any }) => b.status === 'posted' || b.status === 'overdue') || null;

    // Advanced payment balance
    let advancedBalance = 0;
    try {
      const adv: any = await AdvancedPayment.findOne({ where: { tenant_id: tJson.id } });
      if (adv) advancedBalance = Number(adv.remaining_balance || 0);
    } catch (e) {}

    return NextResponse.json({
      success: true,
      tenant: {
        id: tJson.id,
        name: tenantName,
        email: tJson.User?.email || '',
        unit_number: unitNumber,
        building_name: buildingName,
        lease_expiry: leaseExpiry,
        document_url: documentUrl,
      },
      outstandingBill: outstanding,
      recentBills: formattedBills,
      advancedBalance
    });

  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Failed to fetch tenant overview' }, { status: 500 });
  }
}
