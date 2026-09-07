import { Collection, Billing, Tenant, Unit, User, BillingType, Building, syncDatabase } from '@/db/models';
import { Op } from 'sequelize';
import { formatBillingReference, formatBillingCycle, formatCollectionReference } from './utils';

export { formatCollectionReference };

function formatDateSafe(val: any): string {
  if (!val) return new Date().toISOString().split('T')[0];
  if (val instanceof Date) return val.toISOString().split('T')[0];
  if (typeof val === 'string') return val.split('T')[0];
  return String(val).split('T')[0];
}

export interface CollectionRecord {
  id: number;
  admin_id: number;
  billing_id: number;
  amount_paid: number;
  payment_method: 'gcash' | 'qr' | 'cash';
  hitpay_reference?: string;
  status: 'pending' | 'completed' | 'failed';
  receipt_url?: string;
  collected_date?: string;
  reference_number?: string;
  billing_reference_number?: string;
  billing_cycle?: string;
  createdAt?: string;
  updatedAt?: string;

  // flattened properties for frontend convenience
  tenant_name?: string;
  tenant_email?: string;
  unit_number?: string;
  building_name?: string;
  billing_type_name?: string;
  
  Billing?: any;
}

export async function getCollectionsList(options: { query?: string; status?: string; admin_id?: number } = {}) {
  await syncDatabase();
  const { query, status, admin_id } = options;
  const whereClause: any = {};

  if (admin_id) {
    whereClause.admin_id = admin_id;
  }
  if (status && status !== 'all') {
    whereClause.status = status;
  }

  const collections = await Collection.findAll({
    where: whereClause,
    include: [
      {
        model: Billing,
        include: [
          { model: Tenant, include: [{ model: User }] },
          { model: Unit, include: [{ model: Building }] },
          { model: BillingType }
        ]
      }
    ],
    order: [['createdAt', 'DESC']]
  });

  let results = collections.map((c: any) => {
    const item = c.get({ plain: true });
    
    const rawEmail = item.Billing?.Tenant?.User?.email;
    const cleanEmail = rawEmail && !rawEmail.endsWith('@noemail.local') ? rawEmail : '';
    const infoJson = item.Billing?.Tenant?.personal_info_json;
    const tenantName = infoJson?.first_name 
      ? `${infoJson.first_name} ${infoJson.last_name || ''}`.trim()
      : (cleanEmail || `Tenant #${item.Billing?.tenant_id}`);
    const collectedDate = item.collected_date 
      ? formatDateSafe(item.collected_date) 
      : formatDateSafe(item.createdAt);
    const cycle = formatBillingCycle(item.Billing?.billing_cycle || item.Billing?.BillingType?.frequency || 'Monthly');

    return {
      ...item,
      amount_paid: Number(item.amount_paid),
      reference_number: formatCollectionReference(item.id),
      billing_reference_number: formatBillingReference(item.billing_id),
      billing_cycle: cycle,
      collected_date: collectedDate,
      tenant_name: tenantName,
      tenant_email: cleanEmail,
      unit_number: item.Billing?.Unit?.unit_number || '',
      building_name: item.Billing?.Unit?.Building?.name || '',
      billing_type_name: item.Billing?.BillingType?.name || 'General Bill',
    } as CollectionRecord;
  });

  if (query) {
    const q = query.toLowerCase().trim();
    results = results.filter((r: any) =>
      (r.reference_number && r.reference_number.toLowerCase().includes(q)) ||
      (r.billing_reference_number && r.billing_reference_number.toLowerCase().includes(q)) ||
      (r.billing_cycle && r.billing_cycle.toLowerCase().includes(q)) ||
      (r.tenant_name && r.tenant_name.toLowerCase().includes(q)) ||
      (r.tenant_email && r.tenant_email.toLowerCase().includes(q)) ||
      (r.hitpay_reference && r.hitpay_reference.toLowerCase().includes(q)) ||
      (r.unit_number && r.unit_number.toLowerCase().includes(q))
    );
  }

  return results;
}

export async function getCollectionById(id: number, admin_id?: number) {
  await syncDatabase();
  const whereClause: any = { id };
  if (admin_id) whereClause.admin_id = admin_id;

  const collection = await Collection.findOne({
    where: whereClause,
    include: [
      {
        model: Billing,
        include: [
          { model: Tenant, include: [{ model: User }] },
          { model: Unit, include: [{ model: Building }] },
          { model: BillingType }
        ]
      }
    ]
  });
  
  if (!collection) return null;
  
  const item = collection.get({ plain: true });
  const rawEmail = item.Billing?.Tenant?.User?.email;
  const cleanEmail = rawEmail && !rawEmail.endsWith('@noemail.local') ? rawEmail : '';
  const infoJson = item.Billing?.Tenant?.personal_info_json;
  const tenantName = infoJson?.first_name 
    ? `${infoJson.first_name} ${infoJson.last_name || ''}`.trim()
    : (cleanEmail || `Tenant #${item.Billing?.tenant_id}`);
  const collectedDate = item.collected_date 
    ? formatDateSafe(item.collected_date) 
    : formatDateSafe(item.createdAt);
  const cycle = formatBillingCycle(item.Billing?.billing_cycle || item.Billing?.BillingType?.frequency || 'Monthly');

  return {
    ...item,
    amount_paid: Number(item.amount_paid),
    reference_number: formatCollectionReference(item.id),
    billing_reference_number: formatBillingReference(item.billing_id),
    billing_cycle: cycle,
    collected_date: collectedDate,
    tenant_name: tenantName,
    tenant_email: cleanEmail,
    unit_number: item.Billing?.Unit?.unit_number || '',
    building_name: item.Billing?.Unit?.Building?.name || '',
    billing_type_name: item.Billing?.BillingType?.name || 'General Bill',
  } as CollectionRecord;
}

export async function createCollection(data: Partial<CollectionRecord>) {
  await syncDatabase();
  const collection = await Collection.create(data as any);
  return getCollectionById(collection.getDataValue('id'));
}

export async function updateCollection(id: number, data: Partial<CollectionRecord>, admin_id?: number) {
  await syncDatabase();
  const whereClause: any = { id };
  if (admin_id) whereClause.admin_id = admin_id;

  const collection = await Collection.findOne({ where: whereClause });
  if (!collection) throw new Error("Collection not found");

  await collection.update(data as any);
  return getCollectionById(id, admin_id);
}

export async function deleteCollection(id: number, admin_id?: number) {
  await syncDatabase();
  const whereClause: any = { id };
  if (admin_id) whereClause.admin_id = admin_id;

  const collection = await Collection.findOne({ where: whereClause });
  if (!collection) throw new Error("Collection not found");
  
  await collection.destroy();
  return true;
}
