import bcrypt from 'bcrypt';
import { User, Building, Unit, Tenant, Contract, SubscriptionTier, Subscription, syncDatabase } from '@/db/models';

export interface SubscriptionTierRecord {
  id: number;
  name: string;
  max_buildings: number;
  allow_email: boolean;
  price: number;
  features_json?: any;
}

export interface CustomerBuildingInfo {
  id: number;
  name: string;
  address: string;
  units_count: number;
  occupied_units?: number;
}

export interface CustomerRecord {
  id: number;
  email: string;
  name: string; // Contact Person / Admin Name
  company_name: string; // Organization / Property Group
  phone?: string;
  role: 'admin';
  status: 'active' | 'suspended' | 'inactive';
  tier_id: number;
  tier_name: string;
  tier_price: number;
  max_buildings: number;
  allow_email: boolean;
  buildings_count: number;
  units_count: number;
  tenants_count: number;
  total_revenue_contributed?: number;
  created_at: string;
  last_login?: string;
  buildings?: CustomerBuildingInfo[];
  subscription?: {
    id?: number;
    tier_id: number;
    tier_name: string;
    status: string;
    hitpay_reference?: string;
    price: number;
  };
}

export const defaultTiers: SubscriptionTierRecord[] = [
  {
    id: 1,
    name: 'Starter',
    max_buildings: 1,
    allow_email: false,
    price: 999.00,
    features_json: { max_units: 10, max_tenants: 10, analytics: 'basic', custom_branding: false }
  },
  {
    id: 2,
    name: 'Pro',
    max_buildings: 10,
    allow_email: true,
    price: 2499.00,
    features_json: { max_units: 100, max_tenants: 100, analytics: 'advanced', custom_branding: true }
  },
  {
    id: 3,
    name: 'Enterprise',
    max_buildings: 999,
    allow_email: true,
    price: 5999.00,
    features_json: { max_units: null, max_tenants: null, analytics: 'enterprise', custom_branding: true, dedicated_support: true }
  }
];

let mockCustomers: CustomerRecord[] = [
  {
    id: 2,
    email: 'admin1@sunrise.com',
    name: 'Robert Fox',
    company_name: 'Sunrise Property Management',
    phone: '+63 917 555 0101',
    role: 'admin',
    status: 'active',
    tier_id: 2,
    tier_name: 'Pro',
    tier_price: 2499.00,
    max_buildings: 10,
    allow_email: true,
    buildings_count: 2,
    units_count: 7,
    tenants_count: 4,
    total_revenue_contributed: 14994.00,
    created_at: '2024-01-15T08:30:00.000Z',
    last_login: '2024-08-13T14:20:00.000Z',
    buildings: [
      { id: 1, name: 'Sunrise Apartments', address: '123 Main St, Makati City, Metro Manila', units_count: 5, occupied_units: 3 },
      { id: 2, name: 'Sunrise Annex', address: '125 Main St, Makati City, Metro Manila', units_count: 2, occupied_units: 1 }
    ],
    subscription: {
      id: 1,
      tier_id: 2,
      tier_name: 'Pro',
      status: 'active',
      hitpay_reference: 'HPAY_SUB_SUNRISE_01',
      price: 2499.00
    }
  },
  {
    id: 3,
    email: 'admin2@greenview.com',
    name: 'Maria Santos',
    company_name: 'Greenview Residences & Holdings',
    phone: '+63 918 555 0202',
    role: 'admin',
    status: 'active',
    tier_id: 1,
    tier_name: 'Starter',
    tier_price: 999.00,
    max_buildings: 1,
    allow_email: false,
    buildings_count: 1,
    units_count: 3,
    tenants_count: 2,
    total_revenue_contributed: 5994.00,
    created_at: '2024-02-10T10:15:00.000Z',
    last_login: '2024-08-12T09:45:00.000Z',
    buildings: [
      { id: 3, name: 'Greenview Residences', address: '456 Oak Ave, Quezon City, Metro Manila', units_count: 3, occupied_units: 2 }
    ],
    subscription: {
      id: 2,
      tier_id: 1,
      tier_name: 'Starter',
      status: 'active',
      hitpay_reference: 'HPAY_SUB_GREENVIEW_02',
      price: 999.00
    }
  },
  {
    id: 4,
    email: 'contact@apexrealty.ph',
    name: 'Alexander Cruz',
    company_name: 'Apex Prime Realty Corp.',
    phone: '+63 920 555 0303',
    role: 'admin',
    status: 'active',
    tier_id: 3,
    tier_name: 'Enterprise',
    tier_price: 5999.00,
    max_buildings: 999,
    allow_email: true,
    buildings_count: 4,
    units_count: 28,
    tenants_count: 22,
    total_revenue_contributed: 35994.00,
    created_at: '2023-11-01T04:00:00.000Z',
    last_login: '2024-08-14T01:00:00.000Z',
    buildings: [
      { id: 4, name: 'Apex Tower Bonifacio', address: '5th Ave, BGC, Taguig City', units_count: 12, occupied_units: 10 },
      { id: 5, name: 'Apex Suites Ortigas', address: 'F. Ortigas Jr. Rd, Pasig City', units_count: 8, occupied_units: 6 },
      { id: 6, name: 'Apex Loft Alabang', address: 'Filinvest City, Muntinlupa', units_count: 8, occupied_units: 6 }
    ],
    subscription: {
      id: 3,
      tier_id: 3,
      tier_name: 'Enterprise',
      status: 'active',
      hitpay_reference: 'HPAY_SUB_APEX_03',
      price: 5999.00
    }
  },
  {
    id: 5,
    email: 'ops@metrohaven.com',
    name: 'Eleanor Vance',
    company_name: 'Metro Haven Living Solutions',
    phone: '+63 919 555 0404',
    role: 'admin',
    status: 'suspended',
    tier_id: 2,
    tier_name: 'Pro',
    tier_price: 2499.00,
    max_buildings: 10,
    allow_email: true,
    buildings_count: 2,
    units_count: 12,
    tenants_count: 9,
    total_revenue_contributed: 12495.00,
    created_at: '2024-03-20T11:20:00.000Z',
    last_login: '2024-07-28T16:10:00.000Z',
    buildings: [
      { id: 7, name: 'Haven Heights North', address: 'North Ave, Quezon City', units_count: 6, occupied_units: 5 },
      { id: 8, name: 'Haven Heights South', address: 'Alabang-Zapote Rd, Las Piñas', units_count: 6, occupied_units: 4 }
    ],
    subscription: {
      id: 4,
      tier_id: 2,
      tier_name: 'Pro',
      status: 'suspended',
      hitpay_reference: 'HPAY_SUB_METRO_04',
      price: 2499.00
    }
  },
  {
    id: 6,
    email: 'hello@urbancrest.com',
    name: 'David Tan',
    company_name: 'Urban Crest Estates',
    phone: '+63 915 555 0505',
    role: 'admin',
    status: 'active',
    tier_id: 1,
    tier_name: 'Starter',
    tier_price: 999.00,
    max_buildings: 1,
    allow_email: false,
    buildings_count: 1,
    units_count: 5,
    tenants_count: 4,
    total_revenue_contributed: 4995.00,
    created_at: '2024-04-05T09:00:00.000Z',
    last_login: '2024-08-11T18:30:00.000Z',
    buildings: [
      { id: 9, name: 'Urban Crest Condo', address: 'Shaw Blvd, Mandaluyong City', units_count: 5, occupied_units: 4 }
    ],
    subscription: {
      id: 5,
      tier_id: 1,
      tier_name: 'Starter',
      status: 'active',
      hitpay_reference: 'HPAY_SUB_URBAN_05',
      price: 999.00
    }
  }
];

// Helper to get tier by ID
export function getTierInfo(tierId?: number | null): SubscriptionTierRecord {
  const found = defaultTiers.find(t => t.id === Number(tierId));
  return found || defaultTiers[0];
}

// GET ALL CUSTOMERS (with optional filtering)
export async function getCustomersList(filters?: { query?: string; tier_id?: string; status?: string }) {
  await syncDatabase();
  try {
    const dbUsers = await User.findAll({
      where: { role: 'admin' },
      include: [
        {
          model: Building,
          include: [
            {
              model: Unit,
              include: [
                {
                  model: Contract,
                  include: [{ model: Tenant }]
                }
              ]
            }
          ]
        },
        { model: SubscriptionTier }
      ],
      order: [['id', 'DESC']]
    });

    if (dbUsers && dbUsers.length > 0) {
      const customers: CustomerRecord[] = dbUsers.map((u: any) => {
        const item = u.get({ plain: true });
        const buildings = item.Buildings || [];
        const tier = item.SubscriptionTier || getTierInfo(item.tier_id);

        let totalUnits = 0;
        let totalTenants = 0;
        const buildingInfos: CustomerBuildingInfo[] = [];

        buildings.forEach((b: any) => {
          const units = b.Units || [];
          totalUnits += units.length;
          let occupiedInBuilding = 0;

          units.forEach((unit: any) => {
            const contracts = unit.Contracts || [];
            if (contracts.length > 0) {
              totalTenants += contracts.length;
              occupiedInBuilding += 1;
            }
          });

          buildingInfos.push({
            id: b.id,
            name: b.name,
            address: b.address,
            units_count: units.length,
            occupied_units: occupiedInBuilding
          });
        });

        // Find existing mock metadata (for name/phone/company fallback if not in User model)
        const existingMock = mockCustomers.find(m => m.id === item.id || m.email === item.email);
        const name = existingMock?.name || item.email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
        const companyName = existingMock?.company_name || (buildings[0] ? `${buildings[0].name} Management` : `${name} Properties`);
        const phone = existingMock?.phone || '+63 917 000 0000';

        return {
          id: item.id,
          email: item.email,
          name,
          company_name: companyName,
          phone,
          role: 'admin',
          status: (item.status as any) || 'active',
          tier_id: tier?.id || 1,
          tier_name: tier?.name || 'Starter',
          tier_price: Number(tier?.price || 999),
          max_buildings: tier?.max_buildings || 1,
          allow_email: !!tier?.allow_email,
          buildings_count: buildings.length,
          units_count: totalUnits,
          tenants_count: totalTenants,
          total_revenue_contributed: Number(tier?.price || 999) * 6,
          created_at: item.createdAt ? new Date(item.createdAt).toISOString() : new Date().toISOString(),
          last_login: existingMock?.last_login || new Date().toISOString(),
          buildings: buildingInfos,
          subscription: {
            tier_id: tier?.id || 1,
            tier_name: tier?.name || 'Starter',
            status: item.status || 'active',
            price: Number(tier?.price || 999)
          }
        };
      });

      return applyCustomerFilters(customers, filters);
    }
  } catch (err) {
    // Fallback to in-memory store
  }

  return applyCustomerFilters(mockCustomers, filters);
}

// APPLY FILTERS
function applyCustomerFilters(records: CustomerRecord[], filters?: { query?: string; tier_id?: string; status?: string }) {
  let result = [...records];

  if (filters?.query) {
    const q = filters.query.toLowerCase().trim();
    result = result.filter(c => 
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.company_name.toLowerCase().includes(q) ||
      (c.buildings && c.buildings.some(b => b.name.toLowerCase().includes(q) || b.address.toLowerCase().includes(q)))
    );
  }

  if (filters?.tier_id && filters.tier_id !== 'all') {
    const tId = parseInt(filters.tier_id, 10);
    result = result.filter(c => c.tier_id === tId);
  }

  if (filters?.status && filters.status !== 'all') {
    result = result.filter(c => c.status === filters.status);
  }

  return result;
}

// GET SINGLE CUSTOMER
export async function getCustomerById(id: number): Promise<CustomerRecord | null> {
  await syncDatabase();
  try {
    const dbUser: any = await User.findOne({
      where: { id, role: 'admin' },
      include: [
        {
          model: Building,
          include: [
            {
              model: Unit,
              include: [
                {
                  model: Contract,
                  include: [{ model: Tenant }]
                }
              ]
            }
          ]
        },
        { model: SubscriptionTier }
      ]
    });

    if (dbUser) {
      const item = dbUser.get({ plain: true });
      const buildings = item.Buildings || [];
      const tier = item.SubscriptionTier || getTierInfo(item.tier_id);

      let totalUnits = 0;
      let totalTenants = 0;
      const buildingInfos: CustomerBuildingInfo[] = [];

      buildings.forEach((b: any) => {
        const units = b.Units || [];
        totalUnits += units.length;
        let occupiedInBuilding = 0;

        units.forEach((unit: any) => {
          const contracts = unit.Contracts || [];
          if (contracts.length > 0) {
            totalTenants += contracts.length;
            occupiedInBuilding += 1;
          }
        });

        buildingInfos.push({
          id: b.id,
          name: b.name,
          address: b.address,
          units_count: units.length,
          occupied_units: occupiedInBuilding
        });
      });

      const existingMock = mockCustomers.find(m => m.id === id);
      const name = existingMock?.name || item.email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
      const companyName = existingMock?.company_name || (buildings[0] ? `${buildings[0].name} Management` : `${name} Properties`);

      return {
        id: item.id,
        email: item.email,
        name,
        company_name: companyName,
        phone: existingMock?.phone || '+63 917 000 0000',
        role: 'admin',
        status: (item.status as any) || 'active',
        tier_id: tier?.id || 1,
        tier_name: tier?.name || 'Starter',
        tier_price: Number(tier?.price || 999),
        max_buildings: tier?.max_buildings || 1,
        allow_email: !!tier?.allow_email,
        buildings_count: buildings.length,
        units_count: totalUnits,
        tenants_count: totalTenants,
        total_revenue_contributed: Number(tier?.price || 999) * 6,
        created_at: item.createdAt ? new Date(item.createdAt).toISOString() : new Date().toISOString(),
        last_login: existingMock?.last_login || new Date().toISOString(),
        buildings: buildingInfos,
        subscription: {
          tier_id: tier?.id || 1,
          tier_name: tier?.name || 'Starter',
          status: item.status || 'active',
          price: Number(tier?.price || 999)
        }
      };
    }
  } catch (err) {
    // Fallback
  }

  const found = mockCustomers.find(c => c.id === id);
  return found || null;
}

// CREATE CUSTOMER
export async function createCustomer(data: {
  email: string;
  name: string;
  company_name?: string;
  phone?: string;
  password?: string;
  tier_id: number;
  status?: 'active' | 'suspended';
  building_name?: string;
  building_address?: string;
}) {
  await syncDatabase();
  const tierInfo = getTierInfo(data.tier_id);
  const passwordHash = await bcrypt.hash(data.password || 'password123', 10);
  const companyName = data.company_name?.trim() || `${data.name} Properties`;
  const customerStatus = data.status || 'active';

  let createdUser: any = null;
  try {
    createdUser = await User.create({
      role: 'admin',
      email: data.email.trim().toLowerCase(),
      password_hash: passwordHash,
      status: customerStatus,
      tier_id: Number(data.tier_id)
    });

    // Create Subscription record
    await Subscription.create({
      admin_id: createdUser.id,
      tier_id: Number(data.tier_id),
      status: customerStatus,
      hitpay_reference: `HPAY_SUB_${Date.now()}`
    });

    // If initial building is supplied, create building
    let newBuildingInfo: CustomerBuildingInfo[] = [];
    if (data.building_name && data.building_name.trim()) {
      const createdBuilding: any = await Building.create({
        admin_id: createdUser.id,
        name: data.building_name.trim(),
        address: data.building_address?.trim() || '123 Main St, Metro Manila'
      });
      newBuildingInfo.push({
        id: createdBuilding.id,
        name: createdBuilding.name,
        address: createdBuilding.address,
        units_count: 0,
        occupied_units: 0
      });
    }

    const newCustomerRecord: CustomerRecord = {
      id: createdUser.id,
      email: createdUser.email,
      name: data.name.trim(),
      company_name: companyName,
      phone: data.phone?.trim() || '+63 917 123 4567',
      role: 'admin',
      status: customerStatus,
      tier_id: tierInfo.id,
      tier_name: tierInfo.name,
      tier_price: tierInfo.price,
      max_buildings: tierInfo.max_buildings,
      allow_email: tierInfo.allow_email,
      buildings_count: newBuildingInfo.length,
      units_count: 0,
      tenants_count: 0,
      total_revenue_contributed: tierInfo.price,
      created_at: new Date().toISOString(),
      last_login: new Date().toISOString(),
      buildings: newBuildingInfo,
      subscription: {
        tier_id: tierInfo.id,
        tier_name: tierInfo.name,
        status: customerStatus,
        price: tierInfo.price
      }
    };

    mockCustomers.unshift(newCustomerRecord);
    return newCustomerRecord;
  } catch (err) {
    // Fallback if DB offline or table error
    const newId = mockCustomers.length > 0 ? Math.max(...mockCustomers.map(c => c.id)) + 1 : 10;
    const newBuildings: CustomerBuildingInfo[] = [];
    if (data.building_name && data.building_name.trim()) {
      newBuildings.push({
        id: Date.now(),
        name: data.building_name.trim(),
        address: data.building_address?.trim() || '123 Main St, Metro Manila',
        units_count: 0,
        occupied_units: 0
      });
    }

    const newCustomerRecord: CustomerRecord = {
      id: newId,
      email: data.email.trim().toLowerCase(),
      name: data.name.trim(),
      company_name: companyName,
      phone: data.phone?.trim() || '+63 917 123 4567',
      role: 'admin',
      status: customerStatus,
      tier_id: tierInfo.id,
      tier_name: tierInfo.name,
      tier_price: tierInfo.price,
      max_buildings: tierInfo.max_buildings,
      allow_email: tierInfo.allow_email,
      buildings_count: newBuildings.length,
      units_count: 0,
      tenants_count: 0,
      total_revenue_contributed: tierInfo.price,
      created_at: new Date().toISOString(),
      last_login: new Date().toISOString(),
      buildings: newBuildings,
      subscription: {
        id: Date.now(),
        tier_id: tierInfo.id,
        tier_name: tierInfo.name,
        status: customerStatus,
        price: tierInfo.price
      }
    };

    mockCustomers.unshift(newCustomerRecord);
    return newCustomerRecord;
  }
}

// UPDATE CUSTOMER
export async function updateCustomer(id: number, data: {
  email?: string;
  name?: string;
  company_name?: string;
  phone?: string;
  password?: string;
  tier_id?: number;
  status?: 'active' | 'suspended' | 'inactive';
}) {
  await syncDatabase();
  try {
    const user: any = await User.findOne({ where: { id, role: 'admin' } });
    if (user) {
      const updatePayload: any = {};
      if (data.email) updatePayload.email = data.email.trim().toLowerCase();
      if (data.status) updatePayload.status = data.status;
      if (data.tier_id) updatePayload.tier_id = Number(data.tier_id);
      if (data.password && data.password.trim()) {
        updatePayload.password_hash = await bcrypt.hash(data.password.trim(), 10);
      }

      await user.update(updatePayload);

      if (data.tier_id || data.status) {
        const sub: any = await Subscription.findOne({ where: { admin_id: id } });
        if (sub) {
          await sub.update({
            tier_id: data.tier_id ? Number(data.tier_id) : sub.tier_id,
            status: data.status || sub.status
          });
        }
      }
    }
  } catch (err) {
    // Fallback
  }

  const idx = mockCustomers.findIndex(c => c.id === id);
  if (idx !== -1) {
    const existing = mockCustomers[idx];
    const newTier = data.tier_id ? getTierInfo(data.tier_id) : getTierInfo(existing.tier_id);

    const updated: CustomerRecord = {
      ...existing,
      email: data.email?.trim().toLowerCase() || existing.email,
      name: data.name?.trim() || existing.name,
      company_name: data.company_name?.trim() || existing.company_name,
      phone: data.phone !== undefined ? data.phone.trim() : existing.phone,
      status: data.status || existing.status,
      tier_id: newTier.id,
      tier_name: newTier.name,
      tier_price: newTier.price,
      max_buildings: newTier.max_buildings,
      allow_email: newTier.allow_email,
      subscription: {
        ...existing.subscription,
        tier_id: newTier.id,
        tier_name: newTier.name,
        status: data.status || existing.status,
        price: newTier.price
      }
    };
    mockCustomers[idx] = updated;
    return updated;
  }

  return null;
}

// TOGGLE CUSTOMER STATUS (active <-> suspended)
export async function toggleCustomerStatus(id: number) {
  const customer = await getCustomerById(id);
  if (!customer) return null;

  const nextStatus = customer.status === 'active' ? 'suspended' : 'active';
  return updateCustomer(id, { status: nextStatus });
}

// DELETE CUSTOMER
export async function deleteCustomer(id: number) {
  await syncDatabase();
  try {
    const user: any = await User.findOne({ where: { id, role: 'admin' } });
    if (user) {
      // Find all buildings owned by admin
      const buildings = await Building.findAll({ where: { admin_id: id } });
      for (const b of buildings) {
        await Unit.destroy({ where: { building_id: b.get('id') } });
      }
      await Building.destroy({ where: { admin_id: id } });
      await Subscription.destroy({ where: { admin_id: id } });
      await user.destroy();
    }
  } catch (err) {
    // Fallback
  }

  const idx = mockCustomers.findIndex(c => c.id === id);
  if (idx !== -1) {
    mockCustomers.splice(idx, 1);
    return true;
  }
  return true;
}

// GET SUBSCRIPTION TIERS LIST
export async function getSubscriptionTiersList(): Promise<SubscriptionTierRecord[]> {
  await syncDatabase();
  try {
    const dbTiers = await SubscriptionTier.findAll({ order: [['price', 'ASC']] });
    if (dbTiers && dbTiers.length > 0) {
      return dbTiers.map((t: any) => {
        const item = t.get({ plain: true });
        return {
          id: item.id,
          name: item.name,
          max_buildings: item.max_buildings,
          allow_email: !!item.allow_email,
          price: Number(item.price),
          features_json: item.features_json
        };
      });
    }
  } catch (err) {
    // Fallback
  }
  return defaultTiers;
}

// GET AGGREGATE PLATFORM STATS
export async function getCustomerStats() {
  const customers = await getCustomersList();
  const totalCustomers = customers.length;
  const activeCustomers = customers.filter(c => c.status === 'active').length;
  const suspendedCustomers = customers.filter(c => c.status === 'suspended').length;
  const totalBuildings = customers.reduce((sum, c) => sum + (c.buildings_count || 0), 0);
  const totalUnits = customers.reduce((sum, c) => sum + (c.units_count || 0), 0);
  const totalTenants = customers.reduce((sum, c) => sum + (c.tenants_count || 0), 0);
  const totalMRR = customers.filter(c => c.status === 'active').reduce((sum, c) => sum + (c.tier_price || 0), 0);

  const tierDistribution = {
    Starter: customers.filter(c => c.tier_name === 'Starter').length,
    Pro: customers.filter(c => c.tier_name === 'Pro').length,
    Enterprise: customers.filter(c => c.tier_name === 'Enterprise').length
  };

  return {
    totalCustomers,
    activeCustomers,
    suspendedCustomers,
    totalBuildings,
    totalUnits,
    totalTenants,
    totalMRR,
    tierDistribution
  };
}
