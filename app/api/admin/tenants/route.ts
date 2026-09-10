export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getTenantsList, createTenant } from '@/lib/tenantsStore';
import { getAdminIdFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const adminId = await getAdminIdFromRequest(request);
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || '';
    const building_id = searchParams.get('building_id') || 'all';

    const tenants = await getTenantsList({ query, building_id, admin_id: adminId });
    return NextResponse.json({ success: true, tenants });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch tenants' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminId = await getAdminIdFromRequest(request);
    const body = await request.json();
    const { first_name, last_name, email, phone, address, id_type, id_number, emergency_contact, unit_id, move_in_date, move_out_date, document_url, password } = body;

    // Validation
    if (!first_name || !first_name.trim()) {
      return NextResponse.json({ success: false, error: 'First name is required.' }, { status: 400 });
    }
    if (!last_name || !last_name.trim()) {
      return NextResponse.json({ success: false, error: 'Last name is required.' }, { status: 400 });
    }
    if (!unit_id) {
      return NextResponse.json({ success: false, error: 'Assigned unit is required.' }, { status: 400 });
    }
    if (!move_in_date) {
      return NextResponse.json({ success: false, error: 'Move-in date is required.' }, { status: 400 });
    }

    const result = await createTenant({
      admin_id: adminId,
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      email: email ? email.trim() : undefined,
      phone: phone ? phone.trim() : undefined,
      address: address ? address.trim() : undefined,
      id_type: id_type ? id_type.trim() : undefined,
      id_number: id_number ? id_number.trim() : undefined,
      emergency_contact: emergency_contact ? emergency_contact.trim() : '',
      unit_id: Number(unit_id),
      move_in_date: String(move_in_date),
      move_out_date: move_out_date ? String(move_out_date) : undefined,
      document_url: document_url ? String(document_url) : undefined,
      password: password ? String(password) : undefined
    });

    return NextResponse.json({ success: true, tenant: result }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create tenant record' },
      { status: 500 }
    );
  }
}
