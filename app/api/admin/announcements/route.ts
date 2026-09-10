export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { Announcement, Building, syncDatabase } from '@/db/models';
import { getAdminIdFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await syncDatabase();
    const adminId = await getAdminIdFromRequest(request);

    const dbAnnouncements = await Announcement.findAll({
      where: { admin_id: adminId },
      include: [{ model: Building, required: false }],
      order: [['createdAt', 'DESC']]
    });

    const formatted = dbAnnouncements.map((a: any) => {
      const item = a.get({ plain: true });
      return {
        id: item.id,
        admin_id: item.admin_id,
        building_id: item.building_id,
        building_name: item.Building?.name || (item.building_id ? `Building #${item.building_id}` : 'All Buildings'),
        title: item.title,
        content: item.content,
        created_at: item.createdAt || new Date().toISOString()
      };
    });

    return NextResponse.json({ success: true, announcements: formatted });
  } catch (err: any) {
    console.error('Admin announcements GET error:', err);
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
  } catch (err: any) {
    console.error('Admin announcements POST error:', err);
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

    const deletedCount = await Announcement.destroy({ where: { id, admin_id: adminId } });
    if (deletedCount === 0) {
      return NextResponse.json({ success: false, error: 'Announcement not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Admin announcements DELETE error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Failed to delete announcement' }, { status: 500 });
  }
}
