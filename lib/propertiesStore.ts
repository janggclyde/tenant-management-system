import { Building, Unit, Contract, Tenant, User, syncDatabase } from '@/db/models';

export interface BuildingRecord {
  id: number;
  admin_id: number;
  name: string;
  address: string;
  units_count?: number;
  occupied_units?: number;
}

export interface UnitTenant {
  id: number;
  name: string;
  email: string;
  move_in_date?: string;
  move_out_date?: string;
  emergency_contact?: string;
  status?: string;
}

export interface UnitRecord {
  id: number;
  admin_id: number;
  building_id: number;
  unit_number: string;
  status: 'vacant' | 'occupied' | 'maintenance';
  monthly_rent: number;
  building_name?: string;
  tenants?: UnitTenant[];
}

let mockBuildings: BuildingRecord[] = [
  // Admin 2 (Sunrise Properties)
  { id: 1, admin_id: 2, name: 'Sunrise Apartments', address: '123 Main St, Makati City, Metro Manila', units_count: 3, occupied_units: 2 },
  { id: 2, admin_id: 2, name: 'Sunrise Annex', address: '125 Main St, Makati City, Metro Manila', units_count: 2, occupied_units: 1 },
  // Admin 3 (Greenview Residences)
  { id: 3, admin_id: 3, name: 'Greenview Residences', address: '456 Oak Ave, Quezon City, Metro Manila', units_count: 3, occupied_units: 2 }
];

let mockUnits: UnitRecord[] = [
  // Admin 2 Units
  { 
    id: 101, 
    admin_id: 2,
    building_id: 1, 
    unit_number: 'Unit 101', 
    status: 'occupied', 
    monthly_rent: 15500.00, 
    building_name: 'Sunrise Apartments',
    tenants: [
      { id: 1, name: 'Juan Dela Cruz', email: 'juan.delacruz@email.com', move_in_date: '2024-01-15', emergency_contact: '+63 912 345 6790', status: 'Active' }
    ]
  },
  { 
    id: 102, 
    admin_id: 2,
    building_id: 1, 
    unit_number: 'Unit 102', 
    status: 'occupied', 
    monthly_rent: 14000.00, 
    building_name: 'Sunrise Apartments',
    tenants: [
      { id: 2, name: 'Maria Santos', email: 'maria.santos@email.com', move_in_date: '2024-03-01', emergency_contact: '+63 917 123 4568', status: 'Active' }
    ]
  },
  { 
    id: 103, 
    admin_id: 2,
    building_id: 1, 
    unit_number: 'Unit 103', 
    status: 'vacant', 
    monthly_rent: 15000.00, 
    building_name: 'Sunrise Apartments',
    tenants: []
  },
  { 
    id: 104, 
    admin_id: 2,
    building_id: 2, 
    unit_number: 'Unit A1', 
    status: 'vacant', 
    monthly_rent: 12000.00, 
    building_name: 'Sunrise Annex',
    tenants: []
  },
  { 
    id: 105, 
    admin_id: 2,
    building_id: 2, 
    unit_number: 'Unit A2', 
    status: 'occupied', 
    monthly_rent: 12500.00, 
    building_name: 'Sunrise Annex',
    tenants: []
  },
  // Admin 3 Units
  { 
    id: 201, 
    admin_id: 3,
    building_id: 3, 
    unit_number: 'Unit 101', 
    status: 'occupied', 
    monthly_rent: 10000.00, 
    building_name: 'Greenview Residences',
    tenants: [
      { id: 3, name: 'Pedro Reyes', email: 'pedro.reyes@email.com', move_in_date: '2024-02-01', emergency_contact: '+63 918 987 6544', status: 'Active' }
    ]
  },
  { 
    id: 202, 
    admin_id: 3,
    building_id: 3, 
    unit_number: 'Unit 102', 
    status: 'occupied', 
    monthly_rent: 11000.00, 
    building_name: 'Greenview Residences',
    tenants: [
      { id: 4, name: 'Ana Lim', email: 'ana.lim@email.com', move_in_date: '2024-07-01', emergency_contact: '+63 915 111 2223', status: 'Active' }
    ]
  },
  { 
    id: 203, 
    admin_id: 3,
    building_id: 3, 
    unit_number: 'Unit 103', 
    status: 'vacant', 
    monthly_rent: 10500.00, 
    building_name: 'Greenview Residences',
    tenants: []
  }
];

// BUILDINGS
export async function getBuildingsList(adminId?: number) {
  await syncDatabase();
  try {
    const whereClause: any = {};
    if (adminId) {
      whereClause.admin_id = adminId;
    }

    const dbBuildings = await Building.findAll({
      where: whereClause,
      include: [{ model: Unit }],
      order: [['id', 'DESC']]
    });
    if (dbBuildings && dbBuildings.length > 0) {
      return dbBuildings.map((b: any) => {
        const item = b.get({ plain: true });
        const units = item.Units || [];
        const occupied = units.filter((u: any) => u.status === 'occupied').length;
        return {
          id: item.id,
          admin_id: item.admin_id,
          name: item.name,
          address: item.address,
          units_count: units.length,
          occupied_units: occupied
        };
      });
    }
  } catch (err) {
    // DB Fallback
  }

  // Calculate dynamic stats for mock buildings filtered by admin_id
  const filteredBuildings = mockBuildings.filter(b => !adminId || b.admin_id === adminId);
  return filteredBuildings.map(b => {
    const bUnits = mockUnits.filter(u => u.building_id === b.id && (!adminId || u.admin_id === adminId));
    const occupied = bUnits.filter(u => u.status === 'occupied').length;
    return {
      ...b,
      units_count: bUnits.length,
      occupied_units: occupied
    };
  });
}

export async function createBuilding(data: { name: string; address: string; admin_id?: number }) {
  const admin_id = data.admin_id || 2;
  try {
    const created = await Building.create({
      admin_id,
      name: data.name,
      address: data.address
    });
    return created.get({ plain: true });
  } catch (err) {
    // DB Fallback
    const newId = mockBuildings.length > 0 ? Math.max(...mockBuildings.map(b => b.id)) + 1 : 1;
    const newBuilding: BuildingRecord = {
      id: newId,
      admin_id,
      name: data.name,
      address: data.address,
      units_count: 0,
      occupied_units: 0
    };
    mockBuildings.unshift(newBuilding);
    return newBuilding;
  }
}

export async function updateBuilding(id: number, data: { name?: string; address?: string }, adminId?: number) {
  try {
    const whereClause: any = { id };
    if (adminId) whereClause.admin_id = adminId;

    const item = await Building.findOne({ where: whereClause });
    if (item) {
      await item.update(data);
      return item.get({ plain: true });
    }
  } catch (err) {
    // DB Fallback
  }

  const idx = mockBuildings.findIndex(b => b.id === id && (!adminId || b.admin_id === adminId));
  if (idx !== -1) {
    mockBuildings[idx] = { ...mockBuildings[idx], ...data };
    return mockBuildings[idx];
  }
  return null;
}

export async function deleteBuilding(id: number, adminId?: number) {
  try {
    const whereClause: any = { id };
    if (adminId) whereClause.admin_id = adminId;

    const item = await Building.findOne({ where: whereClause });
    if (item) {
      await item.destroy();
      // Also delete associated units
      await Unit.destroy({ where: { building_id: id } });
      return true;
    }
  } catch (err) {
    // DB Fallback
  }

  const idx = mockBuildings.findIndex(b => b.id === id && (!adminId || b.admin_id === adminId));
  if (idx !== -1) {
    mockBuildings.splice(idx, 1);
    // Remove associated units from mock store
    mockUnits = mockUnits.filter(u => u.building_id !== id);
    return true;
  }
  return false;
}

// UNITS
export async function getUnitsList(adminId?: number) {
  try {
    const whereClause: any = {};
    if (adminId) {
      whereClause.admin_id = adminId;
    }

    const dbUnits = await Unit.findAll({
      where: whereClause,
      include: [
        { model: Building },
        { 
          model: Contract, 
          include: [{ model: Tenant, include: [{ model: User }] }] 
        }
      ],
      order: [['id', 'DESC']]
    });
    if (dbUnits && dbUnits.length > 0) {
      return dbUnits.map((u: any) => {
        const item = u.get({ plain: true });
        const contracts = item.Contracts || [];
        const tenants: UnitTenant[] = contracts.map((c: any) => {
          const t = c.Tenant;
          const infoJson = t?.personal_info_json;
          const name = infoJson?.first_name 
            ? `${infoJson.first_name} ${infoJson.last_name || ''}`
            : t?.User?.email || `Tenant #${c.tenant_id}`;

          return {
            id: c.tenant_id,
            name,
            email: t?.User?.email || '',
            move_in_date: c.move_in_date,
            move_out_date: c.move_out_date,
            emergency_contact: t?.emergency_contact || 'N/A',
            status: 'Active'
          };
        });

        const computedStatus = tenants.length > 0 ? 'occupied' : item.status || 'vacant';
        return {
          id: item.id,
          admin_id: item.admin_id,
          building_id: item.building_id,
          unit_number: item.unit_number,
          status: computedStatus,
          monthly_rent: Number(item.monthly_rent || 15000),
          building_name: item.Building?.name || 'Main Building',
          tenants
        };
      });
    }
  } catch (err) {
    // DB Fallback
  }

  const filteredUnits = mockUnits.filter(u => !adminId || u.admin_id === adminId);
  return filteredUnits.map(u => {
    const b = mockBuildings.find(bg => bg.id === u.building_id);
    const tenantsList = u.tenants || [];
    const computedStatus = tenantsList.length > 0 ? 'occupied' : u.status || 'vacant';
    return {
      ...u,
      status: computedStatus,
      building_name: b ? b.name : u.building_name || 'Main Building',
      tenants: tenantsList
    };
  });
}

export async function createUnit(data: { building_id: number; unit_number: string; status?: 'vacant' | 'occupied' | 'maintenance'; monthly_rent?: number; admin_id?: number }) {
  const admin_id = data.admin_id || 2;
  try {
    const created = await Unit.create({
      admin_id,
      building_id: data.building_id,
      unit_number: data.unit_number,
      status: data.status || 'vacant',
      monthly_rent: data.monthly_rent || 15000.00
    });
    return created.get({ plain: true });
  } catch (err) {
    // DB Fallback
    const newId = mockUnits.length > 0 ? Math.max(...mockUnits.map(u => u.id)) + 1 : 101;
    const b = mockBuildings.find(bg => bg.id === Number(data.building_id));
    const newUnit: UnitRecord = {
      id: newId,
      admin_id,
      building_id: Number(data.building_id),
      unit_number: data.unit_number,
      status: data.status || 'vacant',
      monthly_rent: Number(data.monthly_rent || 15000.00),
      building_name: b ? b.name : 'Main Building',
      tenants: []
    };
    mockUnits.unshift(newUnit);
    return newUnit;
  }
}

export async function updateUnit(id: number, data: Partial<UnitRecord>, adminId?: number) {
  try {
    const whereClause: any = { id };
    if (adminId) whereClause.admin_id = adminId;

    const item = await Unit.findOne({ where: whereClause });
    if (item) {
      await item.update(data);
      return item.get({ plain: true });
    }
  } catch (err) {
    // DB Fallback
  }

  const idx = mockUnits.findIndex(u => u.id === id && (!adminId || u.admin_id === adminId));
  if (idx !== -1) {
    const updatedBuilding = data.building_id ? mockBuildings.find(b => b.id === Number(data.building_id)) : null;
    mockUnits[idx] = {
      ...mockUnits[idx],
      ...data,
      building_name: updatedBuilding ? updatedBuilding.name : mockUnits[idx].building_name
    };
    return mockUnits[idx];
  }
  return null;
}

export async function deleteUnit(id: number, adminId?: number) {
  try {
    const whereClause: any = { id };
    if (adminId) whereClause.admin_id = adminId;

    const item = await Unit.findOne({ where: whereClause });
    if (item) {
      await item.destroy();
      return true;
    }
  } catch (err) {
    // DB Fallback
  }

  const idx = mockUnits.findIndex(u => u.id === id && (!adminId || u.admin_id === adminId));
  if (idx !== -1) {
    mockUnits.splice(idx, 1);
    return true;
  }
  return false;
}
