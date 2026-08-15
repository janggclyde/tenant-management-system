export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getCustomersList, createCustomer, getCustomerStats } from '@/lib/customersStore';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || undefined;
    const tier_id = searchParams.get('tier_id') || undefined;
    const status = searchParams.get('status') || undefined;

    const [customers, stats] = await Promise.all([
      getCustomersList({ query, tier_id, status }),
      getCustomerStats()
    ]);

    return NextResponse.json({
      success: true,
      customers,
      stats
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      email,
      name,
      company_name,
      phone,
      password,
      tier_id,
      status,
      building_name,
      building_address
    } = body;

    // Validation
    if (!email || !email.trim()) {
      return NextResponse.json(
        { success: false, error: 'Email address is required.' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }

    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, error: 'Customer contact name is required.' },
        { status: 400 }
      );
    }

    if (!tier_id) {
      return NextResponse.json(
        { success: false, error: 'Please select a subscription tier.' },
        { status: 400 }
      );
    }

    const customer = await createCustomer({
      email: email.trim(),
      name: name.trim(),
      company_name: company_name ? company_name.trim() : undefined,
      phone: phone ? phone.trim() : undefined,
      password: password && password.trim() ? password.trim() : undefined,
      tier_id: Number(tier_id),
      status: status || 'active',
      building_name: building_name ? building_name.trim() : undefined,
      building_address: building_address ? building_address.trim() : undefined
    });

    return NextResponse.json({ success: true, customer }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create customer' },
      { status: 500 }
    );
  }
}
