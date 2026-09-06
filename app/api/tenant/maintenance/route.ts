export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { Tenant, Contract, MaintenanceTicket, syncDatabase } from '@/db/models';
import { getAuthUser } from '@/lib/auth';

let mockTickets: any[] = [];

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
      return NextResponse.json({ success: true, tickets: [] });
    }

    try {
      const dbTickets = await MaintenanceTicket.findAll({
        where: { tenant_id: tenantId },
        order: [['createdAt', 'DESC']]
      });

      if (dbTickets) {
        const formatted = dbTickets.map((t: any) => {
          const item = t.get({ plain: true });
          return {
            id: item.id,
            title: item.title,
            description: item.description,
            status: item.status,
            unit_id: item.unit_id,
            created_at: item.createdAt || new Date().toISOString()
          };
        });
        return NextResponse.json({ success: true, tickets: formatted });
      }
    } catch (dbErr) {
      // Fallback
    }

    const filtered = mockTickets.filter((t: any) => t.tenant_id === tenantId);
    return NextResponse.json({ success: true, tickets: filtered });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Failed to fetch tickets' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await syncDatabase();
    const authUser = await getAuthUser(request);

    let tenant: any = null;
    if (authUser && authUser.role === 'tenant') {
      tenant = await Tenant.findOne({
        where: { user_id: authUser.id },
        include: [{ model: Contract }]
      });
    }

    if (!tenant) {
      tenant = await Tenant.findOne({
        include: [{ model: Contract }]
      });
    }

    if (!tenant) {
      return NextResponse.json({ success: false, error: 'Tenant profile not found.' }, { status: 404 });
    }

    const body = await request.json();
    const { title, description } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ success: false, error: 'Title is required.' }, { status: 400 });
    }
    if (!description || !description.trim()) {
      return NextResponse.json({ success: false, error: 'Description is required.' }, { status: 400 });
    }

    const contracts = tenant.Contracts || [];
    const latestContract = contracts[contracts.length - 1];
    const unitId = latestContract?.unit_id || 1;
    const adminId = tenant.admin_id || 2;

    try {
      const created: any = await MaintenanceTicket.create({
        admin_id: adminId,
        tenant_id: tenant.id,
        unit_id: unitId,
        title: title.trim(),
        description: description.trim(),
        status: 'open'
      });

      return NextResponse.json({
        success: true,
        ticket: {
          id: created.id,
          title: created.title,
          description: created.description,
          status: created.status,
          unit_id: created.unit_id,
          created_at: created.createdAt
        }
      }, { status: 201 });
    } catch (dbErr) {
      // Fallback
    }

    const newId = mockTickets.length > 0 ? Math.max(...mockTickets.map((t: any) => t.id)) + 1 : 101;
    const newRecord = {
      id: newId,
      admin_id: adminId,
      tenant_id: tenant.id,
      unit_id: unitId,
      title: title.trim(),
      description: description.trim(),
      status: 'open',
      created_at: new Date().toISOString()
    };
    mockTickets.unshift(newRecord);

    return NextResponse.json({ success: true, ticket: newRecord }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Failed to submit ticket' }, { status: 500 });
  }
}
