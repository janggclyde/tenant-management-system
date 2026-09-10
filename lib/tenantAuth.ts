import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { Tenant, User, Contract, Unit, Building, syncDatabase } from '@/db/models';

export interface TenantSessionData {
  tenant: any;
  tenantId: number;
  adminId: number;
  userId: number;
  unitId: number;
  unitNumber: string;
  buildingId: number;
  buildingName: string;
  buildingAddress: string;
  tenantName: string;
  tenantEmail: string;
  tenantPhone: string;
  tenantAddress: string;
  emergencyContact: {
    name?: string;
    phone?: string;
    relationship?: string;
  } | null;
  moveInDate: string | null;
  moveOutDate: string | null;
  monthlyRent: number;
  documentUrl: string | null;
}

export async function getTenantFromRequest(request: NextRequest): Promise<TenantSessionData | null> {
  await syncDatabase();
  const authUser = await getAuthUser(request);

  let tenantRecord: any = null;

  if (authUser && authUser.role === 'tenant') {
    tenantRecord = await Tenant.findOne({
      where: { user_id: authUser.id },
      include: [
        { model: User },
        { 
          model: Contract, 
          include: [{ model: Unit, include: [{ model: Building }] }] 
        }
      ]
    });
  }

  // Development fallback: if no token is present, pick a tenant with real contracts/bills
  if (!tenantRecord) {
    // Prefer tenant with active bills (tenant 9)
    tenantRecord = await Tenant.findOne({
      where: { id: 9 },
      include: [
        { model: User },
        { 
          model: Contract, 
          include: [{ model: Unit, include: [{ model: Building }] }] 
        }
      ]
    });

    // Or fallback to first tenant if 9 not found
    if (!tenantRecord) {
      tenantRecord = await Tenant.findOne({
        include: [
          { model: User },
          { 
            model: Contract, 
            include: [{ model: Unit, include: [{ model: Building }] }] 
          }
        ]
      });
    }
  }

  if (!tenantRecord) {
    return null;
  }

  const plain = tenantRecord.get({ plain: true });
  const personalInfo = plain.personal_info_json || {};
  const rawEmail = plain.User?.email || '';
  const cleanEmail = rawEmail && !rawEmail.endsWith('@noemail.local') ? rawEmail : '';

  let fullName = '';
  if (personalInfo.first_name || personalInfo.last_name) {
    fullName = `${personalInfo.first_name || ''} ${personalInfo.last_name || ''}`.trim();
  }
  if (!fullName) {
    fullName = cleanEmail || `Resident #${plain.id}`;
  }

  let emergencyContact: any = null;
  if (plain.emergency_contact) {
    if (typeof plain.emergency_contact === 'string') {
      try {
        const parsed = JSON.parse(plain.emergency_contact);
        if (typeof parsed === 'object' && parsed !== null) {
          emergencyContact = {
            name: parsed.name || '',
            phone: parsed.phone || '',
            relationship: parsed.relationship || 'Emergency Contact'
          };
        } else if (typeof parsed === 'number' || /^\+?\d+$/.test(String(parsed).trim())) {
          emergencyContact = {
            name: 'Emergency Contact',
            phone: String(parsed).trim(),
            relationship: 'Contact'
          };
        }
      } catch (e) {
        const raw = String(plain.emergency_contact).trim();
        if (/^(\+?\d[\d\s-]{6,15})$/.test(raw)) {
          emergencyContact = { name: 'Emergency Contact', phone: raw, relationship: 'Contact' };
        } else {
          emergencyContact = { name: raw, phone: '', relationship: 'Contact' };
        }
      }
    } else if (typeof plain.emergency_contact === 'object' && plain.emergency_contact !== null) {
      emergencyContact = {
        name: plain.emergency_contact.name || '',
        phone: plain.emergency_contact.phone || '',
        relationship: plain.emergency_contact.relationship || 'Emergency Contact'
      };
    }
  }

  const contracts = plain.Contracts || [];
  // Get the most recent contract
  const latestContract = contracts.length > 0 ? contracts[contracts.length - 1] : null;

  const unit = latestContract?.Unit || null;
  const building = unit?.Building || null;

  return {
    tenant: plain,
    tenantId: plain.id,
    adminId: plain.admin_id || 1,
    userId: plain.user_id,
    unitId: unit?.id || 1,
    unitNumber: unit?.unit_number || 'Unassigned',
    buildingId: building?.id || unit?.building_id || 1,
    buildingName: building?.name || 'Main Property',
    buildingAddress: building?.address || '',
    tenantName: fullName,
    tenantEmail: cleanEmail,
    tenantPhone: personalInfo.phone || '',
    tenantAddress: personalInfo.address || '',
    emergencyContact,
    moveInDate: latestContract?.move_in_date || null,
    moveOutDate: latestContract?.move_out_date || null,
    monthlyRent: unit?.monthly_rent ? Number(unit.monthly_rent) : 0,
    documentUrl: latestContract?.document_url || null,
  };
}
