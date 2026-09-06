export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { Tenant, User, Unit, Building, Contract } from '@/db/models';
import { mockTenantsUnits } from '@/lib/billingsStore';
import { getTenantsList } from '@/lib/tenantsStore';
import { getAdminIdFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const adminId = await getAdminIdFromRequest(request);
    const contracts = await Contract.findAll({
      where: { admin_id: adminId },
      include: [
        { model: Tenant, include: [{ model: User }] },
        { model: Unit, include: [{ model: Building }] }
      ]
    });

    if (contracts && contracts.length > 0) {
      const formatted = contracts.map((c: any) => {
        const item = c.get({ plain: true });
        const infoJson = item.Tenant?.personal_info_json;
        const name = infoJson?.first_name 
          ? `${infoJson.first_name} ${infoJson.last_name || ''}`
          : item.Tenant?.User?.email || `Tenant #${item.tenant_id}`;

        return {
          admin_id: item.admin_id,
          tenant_id: item.tenant_id,
          tenant_name: name,
          tenant_email: item.Tenant?.User?.email || '',
          unit_id: item.unit_id,
          unit_number: item.Unit?.unit_number || `Unit #${item.unit_id}`,
          building_name: item.Unit?.Building?.name || 'Main Building',
          monthly_rent: Number(item.Unit?.monthly_rent || 0),
        };
      });

      return NextResponse.json({ success: true, tenantsUnits: formatted });
    }

    // Secondary attempt: load tenants via getTenantsList
    const tenantsList = await getTenantsList({ admin_id: adminId });
    if (tenantsList && tenantsList.length > 0) {
      const formatted = tenantsList
        .filter(t => t.unit_id)
        .map(t => ({
          admin_id: t.admin_id,
          tenant_id: t.id,
          tenant_name: t.full_name,
          tenant_email: t.email || '',
          unit_id: t.unit_id,
          unit_number: t.unit_number || `Unit #${t.unit_id}`,
          building_name: t.building_name || 'Main Building',
          monthly_rent: Number(t.monthly_rent || 0),
        }));
      if (formatted.length > 0) {
        return NextResponse.json({ success: true, tenantsUnits: formatted });
      }
    }
  } catch (error) {
    // Fallback to mock dataset
  }

  const adminId = await getAdminIdFromRequest(request);
  const scopedMock = mockTenantsUnits.filter(tu => !adminId || tu.admin_id === adminId);
  return NextResponse.json({ success: true, tenantsUnits: scopedMock });
}
