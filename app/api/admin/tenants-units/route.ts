export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { Tenant, User, Unit, Building, Contract } from '@/db/models';
import { mockTenantsUnits } from '@/lib/billingsStore';
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
        };
      });

      return NextResponse.json({ success: true, tenantsUnits: formatted });
    }
  } catch (error) {
    // Fallback to mock dataset
  }

  const adminId = await getAdminIdFromRequest(request);
  const scopedMock = mockTenantsUnits.filter(tu => !adminId || tu.admin_id === adminId);
  return NextResponse.json({ success: true, tenantsUnits: scopedMock });
}
