export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { Billing, BillingType, Collection, AdvancedPayment, Notification, syncDatabase } from '@/db/models';
import { getTenantFromRequest } from '@/lib/tenantAuth';

export async function POST(request: NextRequest) {
  try {
    await syncDatabase();
    const session = await getTenantFromRequest(request);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized or tenant profile not found' }, { status: 401 });
    }

    const body = await request.json();
    const { billing_id, amount_paid, payment_method, bank_name, payment_reference, receipt_url } = body;

    if (!billing_id) {
      return NextResponse.json({ success: false, error: 'Billing ID is required' }, { status: 400 });
    }

    const amount = Number(amount_paid);
    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json({ success: false, error: 'A valid payment amount is required' }, { status: 400 });
    }

    if (!payment_method) {
      return NextResponse.json({ success: false, error: 'Payment method is required' }, { status: 400 });
    }

    // Verify billing belongs to this tenant
    const billing: any = await Billing.findOne({
      where: { id: Number(billing_id), tenant_id: session.tenantId },
      include: [{ model: BillingType }, { model: Collection }]
    });

    if (!billing) {
      return NextResponse.json({ success: false, error: 'Bill not found or does not belong to your account' }, { status: 404 });
    }

    // If paying via advance deposit / credit
    if (payment_method === 'advance_credit') {
      const advPayment: any = await AdvancedPayment.findOne({
        where: { tenant_id: session.tenantId }
      });

      const currentBalance = Number(advPayment?.remaining_balance || 0);
      if (!advPayment || currentBalance < amount) {
        return NextResponse.json({
          success: false,
          error: `Insufficient advance credit. Available balance is ₱${currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
        }, { status: 400 });
      }

      await advPayment.update({
        remaining_balance: currentBalance - amount
      });
    }

    const refNo = payment_reference && payment_reference.trim() 
      ? payment_reference.trim() 
      : `TXN-${Date.now().toString().slice(-8)}`;

    const effectiveBankName = bank_name 
      ? bank_name.trim() 
      : payment_method === 'gcash' 
      ? 'GCash' 
      : payment_method === 'advance_credit' 
      ? 'Advance Credit' 
      : null;

    // Create Collection
    const newCollection: any = await Collection.create({
      admin_id: billing.admin_id,
      billing_id: billing.id,
      amount_paid: amount,
      payment_method: payment_method,
      bank_name: effectiveBankName,
      payment_reference: refNo,
      hitpay_reference: refNo,
      collected_date: new Date().toISOString().split('T')[0],
      status: 'completed',
      receipt_url: receipt_url ? receipt_url.trim() : null
    });

    // Create notification for tenant
    try {
      await Notification.create({
        user_id: session.userId,
        type: 'payment_received',
        message: `Your payment of ₱${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} for ${billing.BillingType?.name || 'Rent & Utilities'} (Invoice #${billing.id}) has been recorded. Reference: ${refNo}.`,
        is_read: false
      });
    } catch (notifErr) {}

    // Create notification for admin
    try {
      await Notification.create({
        user_id: billing.admin_id,
        type: 'payment_received',
        message: `Tenant ${session.tenantName} (${session.unitNumber}) settled ₱${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} for Invoice #${billing.id} via ${payment_method.toUpperCase()}.`,
        is_read: false
      });
    } catch (notifErr) {}

    return NextResponse.json({
      success: true,
      message: 'Payment recorded successfully!',
      collection: {
        id: newCollection.id,
        billing_id: billing.id,
        amount_paid: amount,
        payment_method,
        payment_reference: refNo,
        collected_date: newCollection.collected_date,
        status: 'completed'
      }
    }, { status: 201 });

  } catch (err: any) {
    console.error('Tenant payment API error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Payment processing failed' }, { status: 500 });
  }
}
