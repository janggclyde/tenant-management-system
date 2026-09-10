export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { Billing, BillingType, Collection, AdvancedPayment, MaintenanceTicket, Announcement, Notification, Unit } from '@/db/models';
import { getTenantFromRequest } from '@/lib/tenantAuth';
import { Op } from 'sequelize';

export async function GET(request: NextRequest) {
  try {
    const session = await getTenantFromRequest(request);

    if (!session) {
      return NextResponse.json({
        success: true,
        tenant: null,
        outstandingBill: null,
        totalOutstandingAmount: 0,
        recentBills: [],
        advancedBalance: 0,
        maintenance: { activeCount: 0, latestTicket: null },
        announcements: [],
        unreadNotificationsCount: 0
      });
    }

    // 1. Fetch tenant's bills with Collections and Unit
    const bills = await Billing.findAll({
      where: { tenant_id: session.tenantId },
      include: [
        { model: BillingType },
        { model: Collection },
        { model: Unit }
      ],
      order: [['due_date', 'DESC'], ['id', 'DESC']]
    });

    const currentDate = new Date().toISOString().split('T')[0];

    const formattedBills = bills.map((b: any) => {
      const bItem = b.get({ plain: true });
      const collections = bItem.Collections || [];
      const amountPaid = collections.reduce((acc: number, c: any) => acc + Number(c.amount_paid || 0), 0);
      const totalAmount = Number(bItem.amount || 0);

      let calculatedStatus: 'paid' | 'overdue' | 'unpaid' = 'unpaid';
      if (amountPaid >= totalAmount) {
        calculatedStatus = 'paid';
      } else if (bItem.due_date && bItem.due_date < currentDate) {
        calculatedStatus = 'overdue';
      }

      // Base rent is the unit's monthly rent
      const unitRent = Number(bItem.Unit?.monthly_rent || session.monthlyRent || 0);
      const electricityAmt = Number(bItem.meter_readings_json?.electricity?.amount || 0);
      const waterAmt = Number(bItem.meter_readings_json?.water?.amount || 0);
      const submetersTotal = electricityAmt + waterAmt;
      const taxAmt = Number(bItem.tax_amount || 0);
      const transferAmt = Number(bItem.transfer_fee || 0);
      const lateAmt = Number(bItem.late_fee_applied || 0);

      let extraChargesTotal = 0;
      if (Array.isArray(bItem.extra_charges_json)) {
        extraChargesTotal = bItem.extra_charges_json.reduce((acc: number, x: any) => acc + Number(x.amount || 0), 0);
      }

      let baseRent = unitRent;
      if (baseRent <= 0) {
        baseRent = Math.max(0, totalAmount - submetersTotal - extraChargesTotal - taxAmt - transferAmt - lateAmt);
      }

      return {
        id: bItem.id,
        billing_type_name: bItem.BillingType?.name || 'Rent & Utilities',
        base_amount: baseRent,
        amount: totalAmount,
        amount_paid: amountPaid,
        due_date: bItem.due_date,
        billing_cycle: bItem.billing_cycle || bItem.BillingType?.frequency || 'monthly',
        status: calculatedStatus,
        meter_readings: bItem.meter_readings_json || null,
        extra_charges: bItem.extra_charges_json || null,
        created_at: bItem.createdAt
      };
    });

    // Outstanding bills (unpaid or overdue)
    const unpaidBills = formattedBills.filter((b: any) => b.status !== 'paid');
    const totalOutstandingAmount = unpaidBills.reduce((acc: number, b: any) => acc + Number(b.amount || 0), 0);
    const outstandingBill = unpaidBills.length > 0 ? unpaidBills[0] : null;

    // 2. Advanced balance
    let advancedBalance = 0;
    try {
      const adv: any = await AdvancedPayment.findOne({ where: { tenant_id: session.tenantId } });
      if (adv) advancedBalance = Number(adv.remaining_balance || 0);
    } catch (e) {}

    // 3. Maintenance Tickets
    let activeTicketsCount = 0;
    let latestTicket: any = null;
    try {
      activeTicketsCount = await MaintenanceTicket.count({
        where: {
          tenant_id: session.tenantId,
          status: { [Op.in]: ['open', 'in_progress'] }
        }
      });

      const latest = await MaintenanceTicket.findOne({
        where: { tenant_id: session.tenantId },
        order: [['createdAt', 'DESC']]
      });

      if (latest) {
        const item = latest.get({ plain: true });
        latestTicket = {
          id: item.id,
          title: item.title,
          description: item.description,
          status: item.status,
          created_at: item.createdAt
        };
      }
    } catch (e) {}

    // 4. Announcements for tenant based on company ID (admin_id) and building
    let announcements: any[] = [];
    try {
      const announcementWhere: any = {
        admin_id: session.adminId
      };
      if (session.buildingId) {
        announcementWhere[Op.or] = [
          { building_id: session.buildingId },
          { building_id: null }
        ];
      }
      const rawAnnouncements = await Announcement.findAll({
        where: announcementWhere,
        order: [['createdAt', 'DESC']],
        limit: 3
      });

      announcements = rawAnnouncements.map((a: any) => {
        const item = a.get({ plain: true });
        return {
          id: item.id,
          title: item.title,
          content: item.content,
          created_at: item.createdAt
        };
      });
    } catch (e) {}

    // 5. Unread Notifications Count
    let unreadNotificationsCount = 0;
    try {
      unreadNotificationsCount = await Notification.count({
        where: {
          user_id: session.userId,
          is_read: false
        }
      });
    } catch (e) {}

    return NextResponse.json({
      success: true,
      tenant: {
        id: session.tenantId,
        name: session.tenantName,
        email: session.tenantEmail,
        phone: session.tenantPhone,
        address: session.tenantAddress,
        unit_id: session.unitId,
        unit_number: session.unitNumber,
        building_id: session.buildingId,
        building_name: session.buildingName,
        building_address: session.buildingAddress,
        monthly_rent: session.monthlyRent,
        move_in_date: session.moveInDate,
        lease_expiry: session.moveOutDate,
        document_url: session.documentUrl,
        emergency_contact: session.emergencyContact
      },
      outstandingBill,
      totalOutstandingAmount,
      recentBills: formattedBills.slice(0, 5),
      advancedBalance,
      maintenance: {
        activeCount: activeTicketsCount,
        latestTicket
      },
      announcements,
      unreadNotificationsCount
    });

  } catch (err: any) {
    console.error('Tenant overview API error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Failed to fetch tenant overview' }, { status: 500 });
  }
}
