import { Billing, BillingType, Tenant, Unit, Building, User, Collection, syncDatabase } from '@/db/models';

export interface BillingTypeRecord {
  id: number;
  admin_id: number;
  name: string;
  description?: string;
  due_date_type: 'fixed_day' | 'days_after_posting';
  due_date_value: number; // e.g. 5 for 5th day of month, OR 15 for 15 days after posting
  late_fee_type: 'none' | 'fixed' | 'percentage';
  late_fee_amount: number;
  grace_period_days: number;
  tax_percentage: number;
  transfer_fee: number;
  has_meter_reading?: boolean;
  has_electricity?: boolean;
  has_water?: boolean;
  rate_per_unit?: number; // Multiplier peso amount per kWh or cu.m
  electricity_rate_per_unit?: number; // Multiplier peso amount for electricity (₱ / kWh)
  water_rate_per_unit?: number; // Multiplier peso amount for water (₱ / cu.m)
  allow_partial: boolean;
  auto_generate: boolean;
}

export interface MeterReadingItem {
  previous: number;
  current: number;
  consumption: number;
  rate_per_unit: number;
  amount: number;
}

export interface MeterReadingsData {
  electricity?: MeterReadingItem;
  water?: MeterReadingItem;
}

export interface BillingRecord {
  id: number;
  admin_id: number;
  billing_type_id: number;
  tenant_id: number;
  unit_id: number;
  base_amount: number;
  tax_percentage?: number;
  tax_amount: number;
  transfer_fee: number;
  late_fee_applied: number;
  meter_readings_json?: MeterReadingsData;
  extra_charges_json?: any;
  amount: number; // Total amount due
  due_date: string;
  status: 'draft' | 'posted' | 'paid' | 'overdue';
  created_at?: string;
  // Associated object fields
  BillingType?: BillingTypeRecord;
  Tenant?: {
    id: number;
    admin_id?: number;
    user_id: number;
    personal_info_json?: any;
    User?: {
      id: number;
      email: string;
      name?: string;
    };
  };
  Unit?: {
    id: number;
    unit_number: string;
    building_id: number;
    Building?: {
      id: number;
      name: string;
      address?: string;
    };
  };
  tenant_name?: string;
  tenant_email?: string;
  unit_number?: string;
  building_name?: string;
  billing_type_name?: string;
  amount_paid?: number;
}

export let mockBillingTypes: BillingTypeRecord[] = [];
export let mockBillings: BillingRecord[] = [];
export const mockTenantsUnits: any[] = [];

// SERVER-SIDE FINANCIAL & METER READING CALCULATIONS ENGINE
export async function calculateServerSideBilling(data: {
  billing_type_id: number;
  base_amount: number;
  posting_date?: string;
  custom_due_date?: string;
  custom_late_fee?: number;
  admin_id?: number;
  meter_readings?: {
    electricity?: { previous: number; current: number; rate?: number };
    water?: { previous: number; current: number; rate?: number };
  };
  extra_charges?: any[];
}) {
  const types = await getBillingTypesList(data.admin_id);
  const typeConfig = types.find(t => t.id === Number(data.billing_type_id)) || types[0];

  let rawBaseAmount = Number(data.base_amount || 0);

  // Compute Meter Submeter Readings
  const calculatedReadings: MeterReadingsData = {};
  let meterChargesTotal = 0;

  if (data.meter_readings) {
    // Electricity
    if (data.meter_readings.electricity && (data.meter_readings.electricity.current || data.meter_readings.electricity.previous)) {
      const prev = Number(data.meter_readings.electricity.previous || 0);
      const curr = Number(data.meter_readings.electricity.current || 0);
      const consumption = Math.max(0, curr - prev);
      const elecType = types.find(t => t.name.toLowerCase().includes('electric')) || typeConfig;
      const rate = data.meter_readings.electricity.rate || typeConfig?.electricity_rate_per_unit || elecType?.rate_per_unit || 12.50;
      const amt = Math.round((consumption * rate) * 100) / 100;

      calculatedReadings.electricity = {
        previous: prev,
        current: curr,
        consumption,
        rate_per_unit: rate,
        amount: amt
      };
      meterChargesTotal += amt;
    }

    // Water
    if (data.meter_readings.water && (data.meter_readings.water.current || data.meter_readings.water.previous)) {
      const prev = Number(data.meter_readings.water.previous || 0);
      const curr = Number(data.meter_readings.water.current || 0);
      const consumption = Math.max(0, curr - prev);
      const waterType = types.find(t => t.name.toLowerCase().includes('water')) || typeConfig;
      const rate = data.meter_readings.water.rate || typeConfig?.water_rate_per_unit || waterType?.rate_per_unit || 45.00;
      const amt = Math.round((consumption * rate) * 100) / 100;

      calculatedReadings.water = {
        previous: prev,
        current: curr,
        consumption,
        rate_per_unit: rate,
        amount: amt
      };
      meterChargesTotal += amt;
    }
  }

  // Process Extra Charges
  let extraChargesTotal = 0;
  let processedExtraCharges: any[] | undefined = undefined;
  if (data.extra_charges && Array.isArray(data.extra_charges) && data.extra_charges.length > 0) {
    processedExtraCharges = data.extra_charges.map((charge: any) => {
      const amt = Number(charge.amount || 0);
      extraChargesTotal += amt;
      return { ...charge, amount: amt };
    });
  }

  // Effective Base Amount includes submeter charges if entered
  const effectiveBaseAmount = rawBaseAmount + meterChargesTotal;

  const taxPercentage = Number(typeConfig?.tax_percentage || 0);
  const taxAmount = Math.round((effectiveBaseAmount * (taxPercentage / 100)) * 100) / 100;
  const transferFee = Number(typeConfig?.transfer_fee || 0);
  const lateFeeApplied = data.custom_late_fee !== undefined ? Number(data.custom_late_fee) : 0;

  const totalAmount = Math.round((effectiveBaseAmount + extraChargesTotal + taxAmount + transferFee + lateFeeApplied) * 100) / 100;

  // Compute Due Date Server-Side
  let computedDueDate = data.custom_due_date || '';
  if (!computedDueDate) {
    const startDate = data.posting_date ? new Date(data.posting_date) : new Date();
    if (typeConfig?.due_date_type === 'days_after_posting') {
      const days = typeConfig.due_date_value || 15;
      const dueDateObj = new Date(startDate);
      dueDateObj.setDate(dueDateObj.getDate() + days);
      computedDueDate = dueDateObj.toISOString().split('T')[0];
    } else if (typeConfig?.due_date_type === 'fixed_day') {
      const targetDay = typeConfig.due_date_value || 1;
      const dueDateObj = new Date(startDate);
      dueDateObj.setDate(targetDay);
      if (dueDateObj < startDate) {
        dueDateObj.setMonth(dueDateObj.getMonth() + 1);
      }
      computedDueDate = dueDateObj.toISOString().split('T')[0];
    } else {
      const dueDateObj = new Date(startDate);
      dueDateObj.setDate(dueDateObj.getDate() + 14);
      computedDueDate = dueDateObj.toISOString().split('T')[0];
    }
  }

  return {
    billing_type_id: typeConfig?.id || data.billing_type_id,
    billing_type_name: typeConfig?.name || 'General Bill',
    type_config: typeConfig,
    base_amount: rawBaseAmount,
    meter_charges_total: meterChargesTotal,
    extra_charges_total: extraChargesTotal,
    effective_base_amount: effectiveBaseAmount,
    tax_percentage: taxPercentage,
    tax_amount: taxAmount,
    transfer_fee: transferFee,
    late_fee_applied: lateFeeApplied,
    meter_readings: calculatedReadings,
    extra_charges: processedExtraCharges,
    total_amount: totalAmount,
    due_date: computedDueDate
  };
}

// BILLING TYPES CRUD
export async function getBillingTypesList(adminId?: number): Promise<BillingTypeRecord[]> {
  await syncDatabase();
  try {
    const whereClause: any = {};
    if (adminId) {
      whereClause.admin_id = adminId;
    }

    const dbTypes = await BillingType.findAll({
      where: whereClause,
      order: [['id', 'ASC']]
    });
    if (dbTypes && dbTypes.length > 0) {
      return dbTypes.map((t: any) => {
        const item = t.get({ plain: true });
        return {
          id: item.id,
          admin_id: item.admin_id,
          name: item.name,
          description: item.description || '',
          due_date_type: item.due_date_type || 'days_after_posting',
          due_date_value: Number(item.due_date_value || 15),
          late_fee_type: item.late_fee_type || 'fixed',
          late_fee_amount: Number(item.late_fee_amount || 0),
          grace_period_days: Number(item.grace_period_days || 0),
          tax_percentage: Number(item.tax_percentage || 0),
          transfer_fee: Number(item.transfer_fee || 0),
          has_meter_reading: Boolean(item.has_meter_reading),
          has_electricity: Boolean(item.has_electricity ?? (item.has_meter_reading && (item.electricity_rate_per_unit || item.name.toLowerCase().includes('electric')))),
          has_water: Boolean(item.has_water ?? (item.has_meter_reading && (item.water_rate_per_unit || item.name.toLowerCase().includes('water')))),
          rate_per_unit: Number(item.rate_per_unit || 0),
          electricity_rate_per_unit: Number(item.electricity_rate_per_unit || 12.50),
          water_rate_per_unit: Number(item.water_rate_per_unit || 45.00),
          allow_partial: Boolean(item.allow_partial),
          auto_generate: Boolean(item.auto_generate)
        };
      });
    }
  } catch (err) {
    // DB Fallback
  }

  return mockBillingTypes.filter(t => !adminId || t.admin_id === adminId);
}

export async function createBillingType(data: Partial<BillingTypeRecord> & { admin_id?: number }) {
  const admin_id = data.admin_id || 2;
  try {
    const created: any = await BillingType.create({
      admin_id,
      name: data.name,
      description: data.description || '',
      due_date_type: data.due_date_type || 'days_after_posting',
      due_date_value: Number(data.due_date_value || 15),
      late_fee_type: data.late_fee_type || 'none',
      late_fee_amount: Number(data.late_fee_amount || 0),
      grace_period_days: Number(data.grace_period_days || 0),
      tax_percentage: Number(data.tax_percentage || 0),
      transfer_fee: Number(data.transfer_fee || 0),
      has_meter_reading: Boolean(data.has_electricity || data.has_water || data.has_meter_reading),
      has_electricity: Boolean(data.has_electricity),
      has_water: Boolean(data.has_water),
      rate_per_unit: Number(data.rate_per_unit || 0),
      electricity_rate_per_unit: Number(data.electricity_rate_per_unit || 12.50),
      water_rate_per_unit: Number(data.water_rate_per_unit || 45.00),
      allow_partial: Boolean(data.allow_partial),
      auto_generate: Boolean(data.auto_generate)
    });
    return created.get({ plain: true });
  } catch (err) {
    // DB Fallback
    const newId = mockBillingTypes.length > 0 ? Math.max(...mockBillingTypes.map(t => t.id)) + 1 : 1;
    const newRecord: BillingTypeRecord = {
      id: newId,
      admin_id,
      name: data.name || 'New Category',
      description: data.description || '',
      due_date_type: data.due_date_type || 'days_after_posting',
      due_date_value: Number(data.due_date_value || 15),
      late_fee_type: data.late_fee_type || 'none',
      late_fee_amount: Number(data.late_fee_amount || 0),
      grace_period_days: Number(data.grace_period_days || 0),
      tax_percentage: Number(data.tax_percentage || 0),
      transfer_fee: Number(data.transfer_fee || 0),
      has_meter_reading: Boolean(data.has_electricity || data.has_water || data.has_meter_reading),
      has_electricity: Boolean(data.has_electricity),
      has_water: Boolean(data.has_water),
      rate_per_unit: Number(data.rate_per_unit || 0),
      electricity_rate_per_unit: Number(data.electricity_rate_per_unit || 12.50),
      water_rate_per_unit: Number(data.water_rate_per_unit || 45.00),
      allow_partial: Boolean(data.allow_partial),
      auto_generate: Boolean(data.auto_generate)
    };
    mockBillingTypes.push(newRecord);
    return newRecord;
  }
}

export async function updateBillingType(id: number, data: Partial<BillingTypeRecord>, adminId?: number) {
  try {
    const whereClause: any = { id };
    if (adminId) whereClause.admin_id = adminId;

    const item: any = await BillingType.findOne({ where: whereClause });
    if (item) {
      await item.update(data);
      return item.get({ plain: true });
    }
  } catch (err) {
    // DB Fallback
  }

  const idx = mockBillingTypes.findIndex(t => t.id === id && (!adminId || t.admin_id === adminId));
  if (idx !== -1) {
    mockBillingTypes[idx] = { ...mockBillingTypes[idx], ...data };
    return mockBillingTypes[idx];
  }
  return null;
}

export async function deleteBillingType(id: number, adminId?: number) {
  try {
    const whereClause: any = { id };
    if (adminId) whereClause.admin_id = adminId;

    const item: any = await BillingType.findOne({ where: whereClause });
    if (item) {
      await item.destroy();
      return true;
    }
  } catch (err) {
    // DB Fallback
  }

  const idx = mockBillingTypes.findIndex(t => t.id === id && (!adminId || t.admin_id === adminId));
  if (idx !== -1) {
    mockBillingTypes.splice(idx, 1);
    return true;
  }
  return false;
}

// BILLINGS LIST & CRUD
export async function getBillingsList(filters?: { query?: string; status?: string; billing_type_id?: string; admin_id?: number }) {
  try {
    const whereClause: any = {};
    if (filters?.admin_id) {
      whereClause.admin_id = filters.admin_id;
    }

    const dbBillings = await Billing.findAll({
      where: whereClause,
      include: [
        { model: BillingType },
        { model: Tenant, include: [{ model: User }] },
        { model: Unit, include: [{ model: Building }] },
        { model: Collection }
      ],
      order: [['id', 'DESC']]
    });

    if (dbBillings && dbBillings.length > 0) {
      let results = dbBillings.map((b: any) => {
        const item = b.get({ plain: true });
        const collections = item.Collections || [];
        const amountPaid = collections.reduce((acc: number, c: any) => acc + Number(c.amount_paid || 0), 0);
        let calculatedStatus = item.status;
        if (amountPaid >= Number(item.amount)) {
          calculatedStatus = 'paid';
        } else if (item.status === 'posted' && new Date(item.due_date) < new Date()) {
          calculatedStatus = 'overdue';
        }

        const infoJson = item.Tenant?.personal_info_json;
        const tenantName = infoJson?.first_name 
          ? `${infoJson.first_name} ${infoJson.last_name || ''}`
          : item.Tenant?.User?.email || `Tenant #${item.tenant_id}`;

        return {
          id: item.id,
          admin_id: item.admin_id,
          billing_type_id: item.billing_type_id,
          tenant_id: item.tenant_id,
          unit_id: item.unit_id,
          base_amount: Number(item.base_amount || item.amount),
          tax_percentage: Number(item.BillingType?.tax_percentage || 0),
          tax_amount: Number(item.tax_amount || 0),
          transfer_fee: Number(item.transfer_fee || 0),
          late_fee_applied: Number(item.late_fee_applied || 0),
          meter_readings_json: item.meter_readings_json || undefined,
          extra_charges_json: item.extra_charges_json || undefined,
          amount: Number(item.amount),
          due_date: item.due_date,
          status: calculatedStatus,
          created_at: item.createdAt,
          billing_type_name: item.BillingType?.name || 'General Bill',
          tenant_name: tenantName,
          tenant_email: item.Tenant?.User?.email || '',
          unit_number: item.Unit?.unit_number || `Unit #${item.unit_id}`,
          building_name: item.Unit?.Building?.name || 'Main Building',
          amount_paid: amountPaid,
          BillingType: item.BillingType,
          Tenant: item.Tenant,
          Unit: item.Unit
        };
      });

      return applyFilters(results, filters);
    }
  } catch (err) {
    // DB Fallback
  }

  const currentDate = new Date().toISOString().split('T')[0];
  const list = mockBillings.map(item => {
    let calculatedStatus = item.status;
    if (item.amount_paid && item.amount_paid >= item.amount) {
      calculatedStatus = 'paid';
    } else if (item.status === 'posted' && item.due_date < currentDate) {
      calculatedStatus = 'overdue';
    }
    return { ...item, status: calculatedStatus };
  });

  return applyFilters(list, filters);
}

function applyFilters(records: BillingRecord[], filters?: { query?: string; status?: string; billing_type_id?: string; admin_id?: number }) {
  let filtered = [...records];

  if (filters?.admin_id) {
    filtered = filtered.filter(item => item.admin_id === filters.admin_id);
  }

  if (filters?.query) {
    const q = filters.query.toLowerCase().trim();
    filtered = filtered.filter(item => 
      item.id.toString().includes(q) ||
      item.tenant_name?.toLowerCase().includes(q) ||
      item.tenant_email?.toLowerCase().includes(q) ||
      item.unit_number?.toLowerCase().includes(q) ||
      item.building_name?.toLowerCase().includes(q) ||
      item.billing_type_name?.toLowerCase().includes(q)
    );
  }

  if (filters?.status && filters.status !== 'all') {
    filtered = filtered.filter(item => item.status === filters.status);
  }

  if (filters?.billing_type_id && filters.billing_type_id !== 'all') {
    const typeId = parseInt(filters.billing_type_id, 10);
    filtered = filtered.filter(item => item.billing_type_id === typeId);
  }

  return filtered;
}

export async function createBilling(data: {
  billing_type_id: number;
  tenant_id: number;
  unit_id: number;
  base_amount: number;
  status: 'draft' | 'posted';
  custom_due_date?: string;
  custom_late_fee?: number;
  admin_id?: number;
  meter_readings?: any;
  extra_charges?: any[];
}) {
  const admin_id = data.admin_id || 2;
  // Server-Side Financial & Meter Calculation
  const calculated = await calculateServerSideBilling({
    billing_type_id: data.billing_type_id,
    base_amount: data.base_amount,
    custom_due_date: data.custom_due_date,
    custom_late_fee: data.custom_late_fee,
    admin_id,
    meter_readings: data.meter_readings,
    extra_charges: data.extra_charges
  });

  try {
    const created: any = await Billing.create({
      admin_id,
      billing_type_id: data.billing_type_id,
      tenant_id: data.tenant_id,
      unit_id: data.unit_id,
      base_amount: calculated.effective_base_amount,
      tax_amount: calculated.tax_amount,
      transfer_fee: calculated.transfer_fee,
      late_fee_applied: calculated.late_fee_applied,
      meter_readings_json: calculated.meter_readings,
      extra_charges_json: calculated.extra_charges,
      amount: calculated.total_amount,
      due_date: calculated.due_date,
      status: 'draft', // Creation is strictly draft
    });
    return created.get({ plain: true });
  } catch (err) {
    // DB Fallback
    const newId = mockBillings.length > 0 ? Math.max(...mockBillings.map(b => b.id)) + 1 : 1001;
    const bType = mockBillingTypes.find(t => t.id === Number(data.billing_type_id)) || mockBillingTypes[0];
    const tUnit = mockTenantsUnits.find(tu => tu.tenant_id === Number(data.tenant_id) && tu.admin_id === admin_id) || mockTenantsUnits[0];

    const newRecord: BillingRecord = {
      id: newId,
      admin_id,
      billing_type_id: Number(data.billing_type_id),
      tenant_id: Number(data.tenant_id),
      unit_id: Number(data.unit_id || tUnit.unit_id),
      base_amount: calculated.effective_base_amount,
      tax_percentage: calculated.tax_percentage,
      tax_amount: calculated.tax_amount,
      transfer_fee: calculated.transfer_fee,
      late_fee_applied: calculated.late_fee_applied,
      meter_readings_json: calculated.meter_readings,
      extra_charges_json: calculated.extra_charges,
      amount: calculated.total_amount,
      due_date: calculated.due_date,
      status: 'draft',
      created_at: new Date().toISOString().split('T')[0],
      billing_type_name: bType.name,
      tenant_name: tUnit.tenant_name,
      tenant_email: tUnit.tenant_email,
      unit_number: tUnit.unit_number,
      building_name: tUnit.building_name,
      amount_paid: 0
    };

    mockBillings.unshift(newRecord);
    return newRecord;
  }
}

export async function updateBilling(id: number, data: Partial<BillingRecord>, adminId?: number) {
  try {
    const whereClause: any = { id };
    if (adminId) whereClause.admin_id = adminId;

    const item: any = await Billing.findOne({ where: whereClause });
    if (item) {
      await item.update(data);
      return item.get({ plain: true });
    }
  } catch (err) {
    // DB Fallback
  }

  const idx = mockBillings.findIndex(b => b.id === id && (!adminId || b.admin_id === adminId));
  if (idx !== -1) {
    const existing = mockBillings[idx];
    mockBillings[idx] = {
      ...existing,
      ...data
    };
    return mockBillings[idx];
  }
  return null;
}

export async function deleteBilling(id: number, adminId?: number) {
  try {
    const whereClause: any = { id };
    if (adminId) whereClause.admin_id = adminId;

    const item: any = await Billing.findOne({ where: whereClause });
    if (item) {
      await item.destroy();
      return true;
    }
  } catch (err) {
    // DB Fallback
  }

  const idx = mockBillings.findIndex(b => b.id === id && (!adminId || b.admin_id === adminId));
  if (idx !== -1) {
    mockBillings.splice(idx, 1);
    return true;
  }
  return false;
}

export async function getBillingById(id: number, adminId?: number) {
  try {
    const whereClause: any = { id };
    if (adminId) whereClause.admin_id = adminId;

    const dbItem = await Billing.findOne({
      where: whereClause,
      include: [
        { model: BillingType },
        { model: Tenant, include: [{ model: User }] },
        { model: Unit, include: [{ model: Building }] },
        { model: Collection }
      ]
    });
    if (dbItem) {
      const item = dbItem.get({ plain: true });
      const collections = item.Collections || [];
      const amountPaid = collections.reduce((acc: number, c: any) => acc + Number(c.amount_paid || 0), 0);
      let calculatedStatus = item.status;
      if (amountPaid >= Number(item.amount)) {
        calculatedStatus = 'paid';
      } else if (item.status === 'posted' && new Date(item.due_date) < new Date()) {
        calculatedStatus = 'overdue';
      }

      return {
        ...item,
        base_amount: Number(item.base_amount || item.amount),
        tax_percentage: Number(item.BillingType?.tax_percentage || 0),
        tax_amount: Number(item.tax_amount || 0),
        transfer_fee: Number(item.transfer_fee || 0),
        late_fee_applied: Number(item.late_fee_applied || 0),
        meter_readings_json: item.meter_readings_json || undefined,
        extra_charges_json: item.extra_charges_json || undefined,
        amount: Number(item.amount),
        status: calculatedStatus,
        billing_type_name: item.BillingType?.name || 'General Bill',
        tenant_name: item.Tenant?.User?.email || `Tenant #${item.tenant_id}`,
        tenant_email: item.Tenant?.User?.email || '',
        unit_number: item.Unit?.unit_number || `Unit #${item.unit_id}`,
        building_name: item.Unit?.Building?.name || 'Main Building',
        amount_paid: amountPaid,
      };
    }
  } catch (err) {
    // DB Fallback
  }

  return mockBillings.find(b => b.id === id && (!adminId || b.admin_id === adminId)) || null;
}
