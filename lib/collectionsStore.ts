import { Collection, Billing, Tenant, Unit, User, BillingType, Building, syncDatabase } from '@/db/models';
import { Op } from 'sequelize';

export interface CollectionRecord {
  id: number;
  admin_id: number;
  billing_id: number;
  amount_paid: number;
  payment_method: 'gcash' | 'qr' | 'cash';
  hitpay_reference?: string;
  status: 'pending' | 'completed' | 'failed';
  receipt_url?: string;
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
    
    const infoJson = item.Billing?.Tenant?.personal_info_json;
    const tenantName = infoJson?.first_name 
      ? `${infoJson.first_name} ${infoJson.last_name || ''}`
      : item.Billing?.Tenant?.User?.email || `Tenant #${item.Billing?.tenant_id}`;

    return {
      ...item,
      amount_paid: Number(item.amount_paid),
      tenant_name: tenantName,
      tenant_email: item.Billing?.Tenant?.User?.email || '',
      unit_number: item.Billing?.Unit?.unit_number || '',
      building_name: item.Billing?.Unit?.Building?.name || '',
      billing_type_name: item.Billing?.BillingType?.name || 'General Bill',
    } as CollectionRecord;
  });

  if (query) {
    const q = query.toLowerCase();
    results = results.filter((r: any) =>
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
  const infoJson = item.Billing?.Tenant?.personal_info_json;
  const tenantName = infoJson?.first_name 
    ? `${infoJson.first_name} ${infoJson.last_name || ''}`
    : item.Billing?.Tenant?.User?.email || `Tenant #${item.Billing?.tenant_id}`;

  return {
    ...item,
    amount_paid: Number(item.amount_paid),
    tenant_name: tenantName,
    tenant_email: item.Billing?.Tenant?.User?.email || '',
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
