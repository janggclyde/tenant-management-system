export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { toggleCustomerStatus } from '@/lib/customersStore';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const customerId = parseInt(id, 10);

    if (isNaN(customerId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid customer ID' },
        { status: 400 }
      );
    }

    const updated = await toggleCustomerStatus(customerId);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      customer: updated,
      message: `Customer account is now ${updated.status}.`
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to toggle status' },
      { status: 500 }
    );
  }
}
