export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { Tenant, Billing, BillingType, syncDatabase } from '@/db/models';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await syncDatabase();
    const authUser = await getAuthUser(request);

    let tenantId: number | null = null;
    if (authUser && authUser.role === 'tenant') {
      const t: any = await Tenant.findOne({ where: { user_id: authUser.id } });
      if (t) tenantId = t.id;
    }

    if (!tenantId) {
      const firstT: any = await Tenant.findOne();
      if (firstT) tenantId = firstT.id;
    }

    if (!tenantId) {
      return NextResponse.json({ success: true, bills: [] });
    }

    const bills = await Billing.findAll({
      where: { tenant_id: tenantId },
      include: [{ model: BillingType }],
      order: [['id', 'DESC']]
    });

    const formatted = bills.map((b: any) => {
      const item = b.get({ plain: true });
      return {
        id: item.id,
        description: `${item.BillingType?.name || 'Rent & Utilities'} Statement`,
        due_date: item.due_date,
        billing_cycle: item.billing_cycle || item.BillingType?.frequency || 'monthly',
        amount: Number(item.amount),
        status: item.status,
        created_at: item.createdAt
      };
    });

    return NextResponse.json({ success: true, bills: formatted });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Failed to fetch tenant bills' }, { status: 500 });
  }
}
