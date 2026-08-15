export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getSubscriptionTiersList } from '@/lib/customersStore';

export async function GET() {
  try {
    const tiers = await getSubscriptionTiersList();
    return NextResponse.json({ success: true, tiers });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch subscription tiers' },
      { status: 500 }
    );
  }
}
