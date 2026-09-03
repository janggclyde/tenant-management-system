import {
  Tenant,
  User,
  Contract,
  Unit,
  Building,
  syncDatabase,
} from "@/db/models";
import bcrypt from "bcrypt";

export interface TenantRecord {
  id: number;
  admin_id: number;
  user_id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  email?: string;
  emergency_contact: string;
  status: "active" | "inactive";
  // Contract Lease Details
  contract_id?: number;
  unit_id: number;
  unit_number: string;
  building_id: number;
  building_name: string;
  move_in_date: string;
  move_out_date?: string;
  document_url?: string;
  monthly_rent?: number;
}

let mockTenants: TenantRecord[] = [];

export async function getTenantsList(filters?: {
  query?: string;
  building_id?: string;
  admin_id?: number;
}) {
  await syncDatabase();
  try {
    const whereClause: any = {};
    if (filters?.admin_id) {
      whereClause.admin_id = filters.admin_id;
    }

    const dbTenants = await Tenant.findAll({
      where: whereClause,
      include: [
        { model: User },
        {
          model: Contract,
          include: [{ model: Unit, include: [{ model: Building }] }],
        },
      ],
      order: [["id", "DESC"]],
    });

    if (dbTenants && dbTenants.length > 0) {
      let list = dbTenants.map((t: any) => {
        const item = t.get({ plain: true });
        const contracts = item.Contracts || [];
        const latestContract = contracts[contracts.length - 1] || {};
        const infoJson = item.personal_info_json || {};

        const firstName = infoJson.first_name || "";
        const lastName = infoJson.last_name || "";
        const fullName =
          firstName || lastName
            ? `${firstName} ${lastName}`.trim()
            : item.User?.email || `Tenant #${item.id}`;

        return {
          id: item.id,
          admin_id: item.admin_id,
          user_id: item.user_id,
          first_name: firstName,
          last_name: lastName,
          full_name: fullName,
          email: item.User?.email || "",
          emergency_contact: item.emergency_contact || "N/A",
          status: item.User?.status || "active",
          contract_id: latestContract.id,
          unit_id: latestContract.unit_id || 0,
          unit_number: latestContract.Unit?.unit_number || "Unassigned",
          building_id: latestContract.Unit?.building_id || 0,
          building_name:
            latestContract.Unit?.Building?.name || "Unassigned Property",
          move_in_date: latestContract.move_in_date || "",
          move_out_date: latestContract.move_out_date || "",
          document_url: latestContract.document_url || "",
          monthly_rent: Number(latestContract.Unit?.monthly_rent || 0),
        };
      });

      return applyTenantFilters(list, filters);
    }
  } catch (err) {
    // DB Fallback
  }

  return applyTenantFilters(mockTenants, filters);
}

function applyTenantFilters(
  records: TenantRecord[],
  filters?: { query?: string; building_id?: string; admin_id?: number },
) {
  let result = [...records];
  if (filters?.admin_id) {
    result = result.filter((item) => item.admin_id === filters.admin_id);
  }
  if (filters?.query) {
    const q = filters.query.toLowerCase().trim();
    result = result.filter(
      (item) =>
        item.full_name.toLowerCase().includes(q) ||
        (item.email && item.email.toLowerCase().includes(q)) ||
        item.unit_number.toLowerCase().includes(q) ||
        item.building_name.toLowerCase().includes(q),
    );
  }
  if (filters?.building_id && filters.building_id !== "all") {
    const bId = parseInt(filters.building_id, 10);
    result = result.filter((item) => item.building_id === bId);
  }
  return result;
}

export async function createTenant(data: {
  first_name: string;
  last_name: string;
  email?: string;
  emergency_contact?: string;
  unit_id: number;
  move_in_date: string;
  move_out_date?: string;
  document_url?: string;
  admin_id?: number;
  password?: string;
}) {
  const admin_id = data.admin_id || 2;
  try {
    const currentYear = new Date().getFullYear();
    const generatedPassword = data.password || `${data.last_name}${currentYear}`;
    const passwordHash = await bcrypt.hash(generatedPassword, 10);

    // Create User record for the tenant
    const user: any = await User.create({
      role: "tenant",
      email: data.email || null,
      password_hash: passwordHash,
      status: "active",
    });

    // Create Tenant record with admin_id
    const tenant: any = await Tenant.create({
      admin_id,
      user_id: user.id,
      personal_info_json: {
        first_name: data.first_name,
        last_name: data.last_name,
      },
      emergency_contact: data.emergency_contact || "",
    });

    // Create Contract Lease record with admin_id
    const contract = await Contract.create({
      admin_id,
      tenant_id: tenant.id,
      unit_id: data.unit_id,
      move_in_date: data.move_in_date,
      move_out_date: data.move_out_date || null,
      document_url: data.document_url || null,
    });

    // Update Unit status to occupied
    await Unit.update({ status: "occupied" }, { where: { id: data.unit_id } });

    return { tenant, user, contract };
  } catch (err) {
    // DB Fallback
    const newTenantId =
      mockTenants.length > 0
        ? Math.max(...mockTenants.map((t) => t.id)) + 1
        : 1;
    const newUserId = 100 + newTenantId;
    const newContractId = 200 + newTenantId;

    const fullName = `${data.first_name} ${data.last_name}`.trim();
    const newTenantRecord: TenantRecord = {
      id: newTenantId,
      admin_id,
      user_id: newUserId,
      first_name: data.first_name,
      last_name: data.last_name,
      full_name: fullName,
      email: data.email,
      emergency_contact: data.emergency_contact || "N/A",
      status: "active",
      contract_id: newContractId,
      unit_id: Number(data.unit_id),
      unit_number: `Unit #${data.unit_id}`,
      building_id: 1,
      building_name: "Sunrise Apartments",
      move_in_date: data.move_in_date,
      move_out_date: data.move_out_date || "",
      document_url: data.document_url || "",
      monthly_rent: 15000.0,
    };

    mockTenants.unshift(newTenantRecord);
    return newTenantRecord;
  }
}

export async function updateTenant(
  id: number,
  data: Partial<TenantRecord>,
  adminId?: number,
) {
  try {
    const whereClause: any = { id };
    if (adminId) whereClause.admin_id = adminId;

    const tenant: any = await Tenant.findOne({ where: whereClause });
    if (tenant) {
      if (data.first_name || data.last_name) {
        const info = tenant.personal_info_json || {};
        tenant.personal_info_json = {
          ...info,
          first_name: data.first_name || info.first_name,
          last_name: data.last_name || info.last_name,
        };
      }
      if (data.emergency_contact !== undefined) {
        tenant.emergency_contact = data.emergency_contact;
      }
      await tenant.save();

      // Update User email
      if (data.email !== undefined) {
        await User.update(
          { email: data.email || null },
          { where: { id: tenant.user_id } },
        );
      }

      // Update Contract
      if (data.unit_id || data.move_in_date || data.move_out_date) {
        const contract: any = await Contract.findOne({
          where: { tenant_id: id },
        });
        if (contract) {
          await contract.update({
            unit_id: data.unit_id || contract.unit_id,
            move_in_date: data.move_in_date || contract.move_in_date,
            move_out_date: data.move_out_date || contract.move_out_date,
          });
        }
      }

      return tenant.get({ plain: true });
    }
  } catch (err) {
    // DB Fallback
  }

  const idx = mockTenants.findIndex(
    (t) => t.id === id && (!adminId || t.admin_id === adminId),
  );
  if (idx !== -1) {
    const existing = mockTenants[idx];
    const updatedFirstName = data.first_name || existing.first_name;
    const updatedLastName = data.last_name || existing.last_name;

    mockTenants[idx] = {
      ...existing,
      ...data,
      first_name: updatedFirstName,
      last_name: updatedLastName,
      full_name: `${updatedFirstName} ${updatedLastName}`.trim(),
    };
    return mockTenants[idx];
  }
  return null;
}

export async function deleteTenant(id: number, adminId?: number) {
  try {
    const whereClause: any = { id };
    if (adminId) whereClause.admin_id = adminId;

    const tenant: any = await Tenant.findOne({ where: whereClause });
    if (tenant) {
      await Contract.destroy({ where: { tenant_id: id } });
      await User.destroy({ where: { id: tenant.user_id } });
      await tenant.destroy();
      return true;
    }
  } catch (err) {
    // DB Fallback
  }

  const idx = mockTenants.findIndex(
    (t) => t.id === id && (!adminId || t.admin_id === adminId),
  );
  if (idx !== -1) {
    mockTenants.splice(idx, 1);
    return true;
  }
  return false;
}
