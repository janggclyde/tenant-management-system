export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { Announcement, Building, syncDatabase } from '@/db/models';
import { getAdminIdFromRequest } from '@/lib/auth';

let mockAnnouncements: any[] = [];

export async function GET(request: NextRequest) {
  try {
    await syncDatabase();
    const adminId = await getAdminIdFromRequest(request);

    try {
      const dbAnnouncements = await Announcement.findAll({
        where: { admin_id: adminId },
        order: [['createdAt', 'DESC']]
      });

      if (dbAnnouncements && dbAnnouncements.length > 0) {
        const buildings = await Building.findAll({ where: { admin_id: adminId } });
        const buildingMap = new Map(buildings.map((b: any) => [b.id, b.name]));

        const formatted = dbAnnouncements.map((a: any) => {
          const item = a.get({ plain: true });
          return {
            id: item.id,
            admin_id: item.admin_id,
            building_id: item.building_id,
            building_name: item.building_id ? (buildingMap.get(item.building_id) || 'Specific Building') : 'All Buildings',
            title: item.title,
            content: item.content,
            created_at: item.createdAt || new Date().toISOString()
          };
        });

        return NextResponse.json({ success: true, announcements: formatted });
      }
    } catch (dbErr) {
      // Fallback to in-memory store
    }

    const filtered = mockAnnouncements.filter(a => !adminId || a.admin_id === adminId);
    return NextResponse.json({ success: true, announcements: filtered });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Failed to fetch announcements' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await syncDatabase();
    const adminId = await getAdminIdFromRequest(request);
    const body = await request.json();
    const { title, content, building_id } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ success: false, error: 'Announcement title is required.' }, { status: 400 });
    }
    if (!content || !content.trim()) {
      return NextResponse.json({ success: false, error: 'Announcement content is required.' }, { status: 400 });
    }

    const targetBuildingId = building_id && building_id !== 'all' ? Number(building_id) : null;

    try {
      const created: any = await Announcement.create({
        admin_id: adminId,
        building_id: targetBuildingId,
        title: title.trim(),
        content: content.trim()
      });

      let buildingName = 'All Buildings';
      if (targetBuildingId) {
        const b: any = await Building.findByPk(targetBuildingId);
        if (b) buildingName = b.name;
      }

      return NextResponse.json({
        success: true,
        announcement: {
          id: created.id,
          admin_id: adminId,
          building_id: targetBuildingId,
          building_name: buildingName,
          title: created.title,
          content: created.content,
          created_at: created.createdAt
        }
      }, { status: 201 });
    } catch (dbErr) {
      // Fallback
    }

    const newId = mockAnnouncements.length > 0 ? Math.max(...mockAnnouncements.map(a => a.id)) + 1 : 1;
    const newRecord = {
      id: newId,
      admin_id: adminId,
      building_id: targetBuildingId,
      building_name: targetBuildingId ? `Building #${targetBuildingId}` : 'All Buildings',
      title: title.trim(),
      content: content.trim(),
      created_at: new Date().toISOString()
    };
    mockAnnouncements.unshift(newRecord);
    return NextResponse.json({ success: true, announcement: newRecord }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Failed to post announcement' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await syncDatabase();
    const adminId = await getAdminIdFromRequest(request);
    const { searchParams } = new URL(request.url);
    const id = Number(searchParams.get('id'));

    if (!id) {
      return NextResponse.json({ success: false, error: 'Announcement ID is required.' }, { status: 400 });
    }

    try {
      await Announcement.destroy({ where: { id, admin_id: adminId } });
    } catch (err) {
      // Fallback
    }

    const idx = mockAnnouncements.findIndex(a => a.id === id && (!adminId || a.admin_id === adminId));
    if (idx !== -1) mockAnnouncements.splice(idx, 1);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Failed to delete announcement' }, { status: 500 });
  }
}
