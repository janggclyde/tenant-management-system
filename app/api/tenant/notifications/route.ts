export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { Notification, syncDatabase } from '@/db/models';
import { getTenantFromRequest } from '@/lib/tenantAuth';

export async function GET(request: NextRequest) {
  try {
    await syncDatabase();
    const session = await getTenantFromRequest(request);

    if (!session) {
      return NextResponse.json({ success: true, notifications: [], unreadCount: 0 });
    }

    const notifications = await Notification.findAll({
      where: { user_id: session.userId },
      order: [['createdAt', 'DESC']]
    });

    const formatted = notifications.map((n: any) => {
      const item = n.get({ plain: true });
      return {
        id: item.id,
        type: item.type,
        message: item.message,
        is_read: Boolean(item.is_read),
        created_at: item.createdAt
      };
    });

    const unreadCount = formatted.filter((n: any) => !n.is_read).length;

    return NextResponse.json({
      success: true,
      notifications: formatted,
      unreadCount
    });
  } catch (err: any) {
    console.error('Tenant notifications GET error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Failed to fetch notifications' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await syncDatabase();
    const session = await getTenantFromRequest(request);

    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { notification_id, mark_all } = body;

    if (mark_all) {
      await Notification.update(
        { is_read: true },
        { where: { user_id: session.userId, is_read: false } }
      );
      return NextResponse.json({ success: true, message: 'All notifications marked as read' });
    }

    if (notification_id) {
      await Notification.update(
        { is_read: true },
        { where: { id: Number(notification_id), user_id: session.userId } }
      );
      return NextResponse.json({ success: true, message: 'Notification marked as read' });
    }

    return NextResponse.json({ success: false, error: 'Provide notification_id or mark_all: true' }, { status: 400 });
  } catch (err: any) {
    console.error('Tenant notifications POST error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Failed to update notification' }, { status: 500 });
  }
}
