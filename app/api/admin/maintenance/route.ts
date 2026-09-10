export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { MaintenanceTicket, Tenant, User, Unit, Building, Notification, syncDatabase } from '@/db/models';
import { getAdminIdFromRequest } from '@/lib/auth';
import { Op } from 'sequelize';

export async function GET(request: NextRequest) {
  try {
    await syncDatabase();
    const adminId = await getAdminIdFromRequest(request);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';
    const building_id = searchParams.get('building_id') || 'all';
    const query = searchParams.get('query') || '';

    const whereClause: any = {
      admin_id: adminId
    };

    if (status && status !== 'all') {
      whereClause.status = status;
    }

    const unitWhere: any = {};
    if (building_id && building_id !== 'all') {
      unitWhere.building_id = Number(building_id);
    }

    const tickets = await MaintenanceTicket.findAll({
      where: whereClause,
      include: [
        {
          model: Unit,
          where: Object.keys(unitWhere).length > 0 ? unitWhere : undefined,
          include: [{ model: Building }]
        },
        {
          model: Tenant,
          include: [{ model: User }]
        }
      ],
      order: [['createdAt', 'DESC'], ['id', 'DESC']]
    });

    // Calculate metrics across all tickets for this admin
    const allAdminTickets = await MaintenanceTicket.findAll({
      where: { admin_id: adminId },
      attributes: ['status']
    });

    const metrics = {
      total: allAdminTickets.length,
      open: allAdminTickets.filter((t: any) => t.status === 'open').length,
      inProgress: allAdminTickets.filter((t: any) => t.status === 'in_progress').length,
      resolved: allAdminTickets.filter((t: any) => t.status === 'resolved').length,
    };

    let formatted = tickets.map((t: any) => {
      const item = t.get({ plain: true });

      let photos: string[] = [];
      if (Array.isArray(item.photos_json)) {
        photos = item.photos_json;
      } else if (typeof item.photos_json === 'string') {
        try {
          photos = JSON.parse(item.photos_json);
        } catch (e) {
          if (item.photos_json.trim()) photos = [item.photos_json.trim()];
        }
      }

      const tenantInfo = item.Tenant?.personal_info_json || {};
      const rawEmail = item.Tenant?.User?.email;
      const cleanEmail = rawEmail && !rawEmail.endsWith('@noemail.local') ? rawEmail : '';
      const firstName = tenantInfo.first_name || '';
      const lastName = tenantInfo.last_name || '';
      const tenantName = (firstName || lastName)
        ? `${firstName} ${lastName}`.trim()
        : (cleanEmail || `Tenant #${item.tenant_id}`);
      const tenantPhone = tenantInfo.phone || '';

      // Parse Category & Priority from title / description if present
      let category = 'General';
      let cleanTitle = item.title;
      const catMatch = cleanTitle.match(/^\[(.*?)\]\s*(.*)$/);
      if (catMatch) {
        category = catMatch[1];
        cleanTitle = catMatch[2];
      }

      let priority = 'Normal';
      let cleanDescription = item.description || '';
      const prioMatch = cleanDescription.match(/^Priority:\s*(\w+)\n\n([\s\S]*)$/);
      if (prioMatch) {
        priority = prioMatch[1];
        cleanDescription = prioMatch[2];
      }

      return {
        id: item.id,
        title: cleanTitle,
        raw_title: item.title,
        category,
        priority,
        description: cleanDescription,
        raw_description: item.description,
        status: item.status || 'open',
        photos,
        tenant_id: item.tenant_id,
        tenant_name: tenantName,
        tenant_email: cleanEmail,
        tenant_phone: tenantPhone,
        unit_id: item.unit_id,
        unit_number: item.Unit?.unit_number || `Unit #${item.unit_id}`,
        building_id: item.Unit?.Building?.id || null,
        building_name: item.Unit?.Building?.name || 'Main Property',
        building_address: item.Unit?.Building?.address || '',
        created_at: item.createdAt || new Date().toISOString(),
        updated_at: item.updatedAt
      };
    });

    // Apply query search filter if provided
    if (query.trim()) {
      const q = query.toLowerCase().trim();
      formatted = formatted.filter((t: any) => 
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.tenant_name.toLowerCase().includes(q) ||
        t.unit_number.toLowerCase().includes(q) ||
        t.building_name.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
      );
    }

    return NextResponse.json({
      success: true,
      tickets: formatted,
      metrics
    });
  } catch (err: any) {
    console.error('Admin maintenance GET error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Failed to fetch maintenance tickets' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await syncDatabase();
    const adminId = await getAdminIdFromRequest(request);
    const body = await request.json();

    const { tenant_id, unit_id, title, description, category, priority, photos, photo_url } = body;

    if (!unit_id) {
      return NextResponse.json({ success: false, error: 'Target property unit is required.' }, { status: 400 });
    }
    if (!title || !title.trim()) {
      return NextResponse.json({ success: false, error: 'Maintenance subject title is required.' }, { status: 400 });
    }
    if (!description || !description.trim()) {
      return NextResponse.json({ success: false, error: 'Issue description is required.' }, { status: 400 });
    }

    // Format photos
    let photosList: string[] = [];
    if (Array.isArray(photos)) {
      photosList = photos.filter(p => typeof p === 'string' && p.trim().length > 0);
    }
    if (photo_url && typeof photo_url === 'string' && photo_url.trim()) {
      photosList.push(photo_url.trim());
    }

    let fullTitle = title.trim();
    if (category && category !== 'General') {
      fullTitle = `[${category}] ${fullTitle}`;
    }

    let fullDescription = description.trim();
    if (priority && priority !== 'Normal') {
      fullDescription = `Priority: ${priority}\n\n${fullDescription}`;
    }

    const created: any = await MaintenanceTicket.create({
      admin_id: adminId,
      tenant_id: Number(tenant_id || 0),
      unit_id: Number(unit_id),
      title: fullTitle,
      description: fullDescription,
      photos_json: photosList,
      status: 'open'
    });

    // If tenant_id provided, notify the tenant
    if (tenant_id) {
      try {
        const tenant: any = await Tenant.findByPk(Number(tenant_id));
        if (tenant?.user_id) {
          await Notification.create({
            user_id: tenant.user_id,
            type: 'maintenance_opened',
            message: `A new maintenance work order has been logged for your unit: "${title.trim()}".`
          });
        }
      } catch (notifErr) {}
    }

    return NextResponse.json({
      success: true,
      ticket: {
        id: created.id,
        title: created.title,
        status: created.status,
        created_at: created.createdAt
      }
    }, { status: 201 });
  } catch (err: any) {
    console.error('Admin maintenance POST error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Failed to create maintenance ticket' }, { status: 500 });
  }
}
