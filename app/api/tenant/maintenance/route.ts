export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { MaintenanceTicket, Unit, Building, Notification, syncDatabase } from '@/db/models';
import { getTenantFromRequest } from '@/lib/tenantAuth';

export async function GET(request: NextRequest) {
  try {
    await syncDatabase();
    const session = await getTenantFromRequest(request);

    if (!session) {
      return NextResponse.json({ success: true, tickets: [] });
    }

    const dbTickets = await MaintenanceTicket.findAll({
      where: { tenant_id: session.tenantId },
      include: [
        {
          model: Unit,
          include: [{ model: Building }]
        }
      ],
      order: [['createdAt', 'DESC'], ['id', 'DESC']]
    });

    const formatted = dbTickets.map((t: any) => {
      const item = t.get({ plain: true });
      let photos: string[] = [];
      if (Array.isArray(item.photos_json)) {
        photos = item.photos_json;
      } else if (typeof item.photos_json === 'string') {
        try {
          photos = JSON.parse(item.photos_json);
        } catch (e) {
          photos = [item.photos_json];
        }
      }

      return {
        id: item.id,
        title: item.title,
        description: item.description,
        status: item.status || 'open',
        unit_id: item.unit_id,
        unit_number: item.Unit?.unit_number || session.unitNumber,
        building_name: item.Unit?.Building?.name || session.buildingName,
        photos,
        created_at: item.createdAt || new Date().toISOString(),
        updated_at: item.updatedAt
      };
    });

    return NextResponse.json({ success: true, tickets: formatted });
  } catch (err: any) {
    console.error('Tenant maintenance GET error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Failed to fetch tickets' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await syncDatabase();
    const session = await getTenantFromRequest(request);

    if (!session) {
      return NextResponse.json({ success: false, error: 'Tenant profile not found or unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, category, priority, photo_url, photos } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ success: false, error: 'Subject title is required.' }, { status: 400 });
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

    // Embed category and priority in title/description if provided
    let fullTitle = title.trim();
    if (category && category !== 'General') {
      fullTitle = `[${category}] ${fullTitle}`;
    }

    let fullDescription = description.trim();
    if (priority && priority !== 'Normal') {
      fullDescription = `Priority: ${priority}\n\n${fullDescription}`;
    }

    const created: any = await MaintenanceTicket.create({
      admin_id: session.adminId,
      tenant_id: session.tenantId,
      unit_id: session.unitId,
      title: fullTitle,
      description: fullDescription,
      photos_json: photosList.length > 0 ? photosList : null,
      status: 'open'
    });

    // Create Notification for admin
    try {
      await Notification.create({
        user_id: session.adminId,
        type: 'maintenance_update',
        message: `New maintenance request from ${session.tenantName} (${session.unitNumber}): "${fullTitle}".`,
        is_read: false
      });
    } catch (notifErr) {}

    // Create Notification for tenant
    try {
      await Notification.create({
        user_id: session.userId,
        type: 'maintenance_update',
        message: `Your maintenance ticket #${created.id} ("${fullTitle}") has been submitted to property management.`,
        is_read: false
      });
    } catch (notifErr) {}

    return NextResponse.json({
      success: true,
      ticket: {
        id: created.id,
        title: created.title,
        description: created.description,
        status: created.status,
        unit_id: created.unit_id,
        unit_number: session.unitNumber,
        photos: photosList,
        created_at: created.createdAt
      }
    }, { status: 201 });

  } catch (err: any) {
    console.error('Tenant maintenance POST error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Failed to submit maintenance ticket' }, { status: 500 });
  }
}
