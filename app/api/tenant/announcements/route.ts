export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { Announcement, Building, syncDatabase } from '@/db/models';
import { getTenantFromRequest } from '@/lib/tenantAuth';
import { Op } from 'sequelize';

export async function GET(request: NextRequest) {
  try {
    await syncDatabase();
    const session = await getTenantFromRequest(request);

    if (!session) {
      return NextResponse.json({ success: true, announcements: [] });
    }

    const whereClause: any = {
      admin_id: session.adminId
    };
    if (session.buildingId) {
      whereClause[Op.or] = [
        { building_id: session.buildingId },
        { building_id: null }
      ];
    }

    const announcements = await Announcement.findAll({
      where: whereClause,
      include: [{ model: Building, required: false }],
      order: [['createdAt', 'DESC']]
    });

    const formatted = announcements.map((a: any) => {
      const item = a.get({ plain: true });
      return {
        id: item.id,
        title: item.title,
        content: item.content,
        building_id: item.building_id,
        building_name: item.Building?.name || 'All Buildings / Community',
        created_at: item.createdAt
      };
    });

    return NextResponse.json({ success: true, announcements: formatted });
  } catch (err: any) {
    console.error('Tenant announcements GET error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Failed to fetch announcements' }, { status: 500 });
  }
}
