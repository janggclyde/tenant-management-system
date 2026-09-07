import { Billing, BillingType, Tenant, Unit, Building, User, Collection, syncDatabase } from '@/db/models';

export type BillingFrequency = 'monthly' | 'quarterly' | 'annually' | 'one_time';

export interface BillingTypeRecord {
  id: number;
  admin_id: number;
  name: string;
  description?: string;
  frequency?: BillingFrequency;
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
  billing_cycle?: BillingFrequency | string;
  base_amount: number;
  tax_percentage?: number;
  tax_amount: number;
  transfer_fee: number;
  late_fee_applied: number;
  meter_readings_json?: MeterReadingsData;
  extra_charges_json?: any;
  reference_number?: string;
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

export function extractBillingFrequency(cycle?: string, defaultFrequency: BillingFrequency = 'monthly'): BillingFrequency {
  if (!cycle) return defaultFrequency;
  const c = cycle.toLowerCase().trim();
  if (c === 'one_time' || c === 'one-time' || c === 'onetime' || c.includes('one-time')) {
    return 'one_time';
  }
  if (defaultFrequency === 'quarterly' || c === 'quarterly' || c.startsWith('q1') || c.startsWith('q2') || c.startsWith('q3') || c.startsWith('q4') || c.includes('quarter')) {
    return 'quarterly';
  }
  // Check annual date range: e.g. "Jan 26 2026 - Jan 26 2027"
  const sameMonthAnnualMatch = c.match(/([a-z]+)\s+\d+\s+(\d{4})\s*-\s*\1\s+\d+\s+(\d{4})/i);
  if (sameMonthAnnualMatch) {
    return 'annually';
  }
  const annualRangeMatch = c.match(/(\d{4})\s*-\s*.*?(\d{4})/);
  if (annualRangeMatch && parseInt(annualRangeMatch[2], 10) - parseInt(annualRangeMatch[1], 10) === 1 && !/oct|nov|dec/i.test(c)) {
    return 'annually';
  }
  if (c === 'annually' || c === 'annual' || /^\d{4}$/.test(c) || c.startsWith('year')) {
    return 'annually';
  }
  if (c === 'monthly') {
    return 'monthly';
  }
  const monthNames = [
    'january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december',
    'jan', 'feb', 'mar', 'apr', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'
  ];
  if (monthNames.some(m => c.includes(m))) {
    return 'monthly';
  }
  return defaultFrequency;
}

import { formatBillingCycle, formatBillingReference } from './utils';
export { formatBillingCycle, formatBillingReference };

// SERVER-SIDE FINANCIAL & METER READING CALCULATIONS ENGINE
export async function calculateServerSideBilling(data: {
  billing_type_id: number;
  base_amount: number;
  billing_cycle?: BillingFrequency | string;
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

  const frequency: BillingFrequency = extractBillingFrequency(data.billing_cycle, typeConfig?.frequency || 'monthly');
  const cycleMultiplier = frequency === 'quarterly' ? 3 : frequency === 'annually' ? 12 : 1;

  let rawBaseAmount = Number(data.base_amount || 0);
  const cycleBaseAmount = rawBaseAmount * cycleMultiplier;

  // Compute Meter Submeter Readings
  const calculatedReadings: MeterReadingsData = {};
  let meterChargesTotal = 0;

  if (data.meter_readings) {
    // Electricity
    if (data.meter_readings.electricity) {
      const prev = Number(data.meter_readings.electricity.previous || 0);
      const curr = Number(data.meter_readings.electricity.current || 0);
      const consumption = Math.max(0, curr - prev);
      const elecType = types.find(t => t.name.toLowerCase().includes('electric')) || typeConfig;
      const rate = Number(data.meter_readings.electricity.rate ?? typeConfig?.electricity_rate_per_unit ?? elecType?.rate_per_unit ?? 12.50);
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
    if (data.meter_readings.water) {
      const prev = Number(data.meter_readings.water.previous || 0);
      const curr = Number(data.meter_readings.water.current || 0);
      const consumption = Math.max(0, curr - prev);
      const waterType = types.find(t => t.name.toLowerCase().includes('water')) || typeConfig;
      const rate = Number(data.meter_readings.water.rate ?? typeConfig?.water_rate_per_unit ?? waterType?.rate_per_unit ?? 45.00);
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

  // Effective Base Amount includes cycle-adjusted base amount and submeter charges
  const effectiveBaseAmount = cycleBaseAmount + meterChargesTotal;

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
    billing_cycle: data.billing_cycle || frequency,
    cycle_multiplier: cycleMultiplier,
    raw_base_amount: rawBaseAmount,
    cycle_base_amount: cycleBaseAmount,
    type_config: typeConfig,
    base_amount: cycleBaseAmount,
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
          frequency: (item.frequency as BillingFrequency) || 'monthly',
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
  } catch (err: any) {
    // Database schema fallback: If model column query fails, fetch directly from BillingTypes table
    try {
      const seq = (BillingType as any).sequelize;
      if (seq) {
        const [rawRows]: any = await seq.query('SELECT * FROM `BillingTypes` ORDER BY id ASC');
        if (rawRows && rawRows.length > 0) {
          const filtered = adminId ? rawRows.filter((r: any) => r.admin_id === adminId) : rawRows;
          return filtered.map((item: any) => ({
            id: item.id,
            admin_id: item.admin_id,
            name: item.name,
            description: item.description || '',
            frequency: (item.frequency as BillingFrequency) || 'monthly',
            due_date_type: item.due_date_type || 'days_after_posting',
            due_date_value: Number(item.due_date_value || 15),
            late_fee_type: item.late_fee_type || 'fixed',
            late_fee_amount: Number(item.late_fee_amount || 0),
            grace_period_days: Number(item.grace_period_days || 0),
            tax_percentage: Number(item.tax_percentage || 0),
            transfer_fee: Number(item.transfer_fee || 0),
            has_meter_reading: Boolean(item.has_meter_reading),
            has_electricity: Boolean(item.has_electricity ?? (item.has_meter_reading && (item.electricity_rate_per_unit || item.name?.toLowerCase().includes('electric')))),
            has_water: Boolean(item.has_water ?? (item.has_meter_reading && (item.water_rate_per_unit || item.name?.toLowerCase().includes('water')))),
            rate_per_unit: Number(item.rate_per_unit || 0),
            electricity_rate_per_unit: Number(item.electricity_rate_per_unit || 12.50),
            water_rate_per_unit: Number(item.water_rate_per_unit || 45.00),
            allow_partial: Boolean(item.allow_partial),
            auto_generate: Boolean(item.auto_generate)
          }));
        }
      }
    } catch (rawErr) {
      console.warn('Raw query fallback for BillingTypes failed:', rawErr);
    }
  }

  return mockBillingTypes.filter(t => !adminId || t.admin_id === adminId);
}

export async function createBillingType(data: Partial<BillingTypeRecord> & { admin_id?: number }) {
  const admin_id = data.admin_id || 2;
  const frequency = (data.frequency as BillingFrequency) || 'monthly';
  try {
    const created: any = await BillingType.create({
      admin_id,
      name: data.name,
      description: data.description || '',
      frequency,
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
      frequency,
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
  await syncDatabase();
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

        const rawEmail = item.Tenant?.User?.email;
        const cleanEmail = rawEmail && !rawEmail.endsWith('@noemail.local') ? rawEmail : '';
        const infoJson = item.Tenant?.personal_info_json;
        const tenantName = infoJson?.first_name 
          ? `${infoJson.first_name} ${infoJson.last_name || ''}`.trim()
          : (cleanEmail || `Tenant #${item.tenant_id}`);

        return {
          id: item.id,
          reference_number: formatBillingReference(item.id),
          admin_id: item.admin_id,
          billing_type_id: item.billing_type_id,
          tenant_id: item.tenant_id,
          unit_id: item.unit_id,
          billing_cycle: item.billing_cycle || item.BillingType?.frequency || 'monthly',
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
          tenant_email: cleanEmail,
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
    return { ...item, reference_number: formatBillingReference(item.id), status: calculatedStatus };
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
      (item.reference_number && item.reference_number.toLowerCase().includes(q)) ||
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
  billing_cycle?: string;
  status: 'draft' | 'posted';
  custom_due_date?: string;
  custom_late_fee?: number;
  admin_id?: number;
  meter_readings?: any;
  extra_charges?: any[];
}) {
  await syncDatabase();
  const admin_id = data.admin_id || 2;
  // Server-Side Financial & Meter Calculation
  const calculated = await calculateServerSideBilling({
    billing_type_id: data.billing_type_id,
    base_amount: data.base_amount,
    billing_cycle: data.billing_cycle,
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
      billing_cycle: data.billing_cycle || calculated.billing_cycle || 'monthly',
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
    const createdId = created.getDataValue ? created.getDataValue('id') : created.id;
    const fullBilling = await getBillingById(createdId, admin_id);
    if (fullBilling) return fullBilling;

    const plain = created.get({ plain: true });
    return {
      ...plain,
      reference_number: formatBillingReference(plain.id)
    };
  } catch (err) {
    console.error('Database createBilling error:', err);
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
      billing_cycle: data.billing_cycle || calculated.billing_cycle || bType?.frequency || 'monthly',
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

export async function updateBilling(id: number, data: Partial<BillingRecord> & { meter_readings?: any; extra_charges?: any[] }, adminId?: number) {
  const patchData: any = { ...data };
  if (data.meter_readings && !patchData.meter_readings_json) {
    patchData.meter_readings_json = data.meter_readings;
  }
  if (data.extra_charges && !patchData.extra_charges_json) {
    patchData.extra_charges_json = data.extra_charges;
  }

  try {
    const whereClause: any = { id };
    if (adminId) whereClause.admin_id = adminId;

    const item: any = await Billing.findOne({ where: whereClause });
    if (item) {
      if (data.meter_readings !== undefined || data.extra_charges !== undefined || data.base_amount !== undefined) {
        const typeId = Number(data.billing_type_id || item.billing_type_id);
        const baseAmt = Number(data.base_amount !== undefined ? data.base_amount : item.base_amount);
        const cycle = data.billing_cycle || item.billing_cycle || 'monthly';
        const mReadings = data.meter_readings !== undefined ? data.meter_readings : item.meter_readings_json;
        const eCharges = data.extra_charges !== undefined ? data.extra_charges : item.extra_charges_json;

        const calculated = await calculateServerSideBilling({
          billing_type_id: typeId,
          base_amount: baseAmt,
          billing_cycle: cycle,
          admin_id: adminId || item.admin_id,
          meter_readings: mReadings,
          extra_charges: eCharges,
          custom_due_date: data.due_date || item.due_date,
          custom_late_fee: data.late_fee_applied !== undefined ? Number(data.late_fee_applied) : Number(item.late_fee_applied || 0)
        });

        patchData.base_amount = calculated.effective_base_amount;
        patchData.amount = calculated.total_amount;
        patchData.meter_readings_json = calculated.meter_readings;
        patchData.extra_charges_json = calculated.extra_charges;
        patchData.tax_amount = calculated.tax_amount;
        patchData.transfer_fee = calculated.transfer_fee;
      }

      await item.update(patchData);
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
      ...patchData
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

      const rawEmail = item.Tenant?.User?.email;
      const cleanEmail = rawEmail && !rawEmail.endsWith('@noemail.local') ? rawEmail : '';
      const infoJson = item.Tenant?.personal_info_json;
      const tenantName = infoJson?.first_name 
        ? `${infoJson.first_name} ${infoJson.last_name || ''}`.trim()
        : (cleanEmail || `Tenant #${item.tenant_id}`);

      return {
        ...item,
        reference_number: formatBillingReference(item.id),
        billing_cycle: item.billing_cycle || item.BillingType?.frequency || 'monthly',
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
        tenant_name: tenantName,
        tenant_email: cleanEmail,
        unit_number: item.Unit?.unit_number || `Unit #${item.unit_id}`,
        building_name: item.Unit?.Building?.name || 'Main Building',
        amount_paid: amountPaid,
      };
    }
  } catch (err) {
    // DB Fallback
  }

  const mockFound = mockBillings.find(b => b.id === id && (!adminId || b.admin_id === adminId));
  if (mockFound) {
    return { ...mockFound, reference_number: formatBillingReference(mockFound.id) };
  }
  return null;
}
