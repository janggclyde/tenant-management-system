export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { MaintenanceTicket, Tenant, Notification, syncDatabase } from '@/db/models';
import { getAdminIdFromRequest } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await syncDatabase();
    const adminId = await getAdminIdFromRequest(request);
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id, 10);

    if (isNaN(id)) {
      return NextResponse.json({ success: false, error: 'Invalid Ticket ID' }, { status: 400 });
    }

    const ticket: any = await MaintenanceTicket.findOne({
      where: { id, admin_id: adminId }
    });

    if (!ticket) {
      return NextResponse.json({ success: false, error: 'Maintenance ticket not found or access denied' }, { status: 404 });
    }

    const body = await request.json();
    const { status, resolution_note, priority, category } = body;

    const previousStatus = ticket.status;
    const updateData: any = {};

    if (status && ['open', 'in_progress', 'resolved'].includes(status)) {
      updateData.status = status;
    }

    // Append resolution or progress note to description if provided
    if (resolution_note && resolution_note.trim()) {
      const timestamp = new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
      const noteEntry = `\n\n[Admin Update • ${timestamp}]:\n${resolution_note.trim()}`;
      updateData.description = `${ticket.description || ''}${noteEntry}`;
    }

    await ticket.update(updateData);

    // If status changed or note was added, notify tenant
    if (ticket.tenant_id && (status !== previousStatus || resolution_note)) {
      try {
        const tenant: any = await Tenant.findByPk(ticket.tenant_id);
        if (tenant?.user_id) {
          let msg = `Your maintenance request "${ticket.title}" status is now: ${ticket.status.replace('_', ' ').toUpperCase()}.`;
          if (status === 'resolved') {
            msg = `Great news! Your maintenance request "${ticket.title}" has been marked as RESOLVED.`;
          } else if (status === 'in_progress') {
            msg = `Your maintenance request "${ticket.title}" is now IN PROGRESS and being serviced.`;
          }
          if (resolution_note && resolution_note.trim()) {
            msg += ` Note: ${resolution_note.trim()}`;
          }

          await Notification.create({
            user_id: tenant.user_id,
            type: 'maintenance_status',
            message: msg
          });
        }
      } catch (notifErr) {}
    }

    return NextResponse.json({
      success: true,
      ticket: {
        id: ticket.id,
        status: ticket.status,
        updated_at: ticket.updatedAt
      }
    });
  } catch (err: any) {
    console.error('Admin maintenance PUT error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Failed to update maintenance ticket' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await syncDatabase();
    const adminId = await getAdminIdFromRequest(request);
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id, 10);

    if (isNaN(id)) {
      return NextResponse.json({ success: false, error: 'Invalid Ticket ID' }, { status: 400 });
    }

    const deleted = await MaintenanceTicket.destroy({
      where: { id, admin_id: adminId }
    });

    if (deleted === 0) {
      return NextResponse.json({ success: false, error: 'Ticket not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Maintenance ticket deleted successfully' });
  } catch (err: any) {
    console.error('Admin maintenance DELETE error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Failed to delete maintenance ticket' }, { status: 500 });
  }
}
