import {
  Tenant,
  User,
  Contract,
  Unit,
  Building,
  Billing,
  BillingType,
  Collection,
  MaintenanceTicket,
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
  phone?: string;
  address?: string;
  id_type?: string;
  id_number?: string;
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

        const rawEmail = item.User?.email;
        const cleanEmail = rawEmail && !rawEmail.endsWith("@noemail.local") ? rawEmail : "";
        const firstName = infoJson.first_name || "";
        const lastName = infoJson.last_name || "";
        const fullName =
          firstName || lastName
            ? `${firstName} ${lastName}`.trim()
            : cleanEmail || `Tenant #${item.id}`;

        const phone = infoJson.phone || "";
        const address = infoJson.address || "";
        const idType = infoJson.id_type || "";
        const idNumber = infoJson.id_number || "";

        // Format emergency contact string cleanly
        let formattedEmergency = item.emergency_contact || "";
        if (formattedEmergency) {
          try {
            const parsed = JSON.parse(formattedEmergency);
            if (typeof parsed === "object" && parsed !== null) {
              const eName = parsed.name || "";
              const ePhone = parsed.phone || "";
              const eRel = parsed.relationship ? ` (${parsed.relationship})` : "";
              if (eName && ePhone) {
                formattedEmergency = `${eName}${eRel}: ${ePhone}`;
              } else if (ePhone) {
                formattedEmergency = ePhone;
              } else if (eName) {
                formattedEmergency = `${eName}${eRel}`;
              }
            } else if (typeof parsed === "number") {
              formattedEmergency = String(parsed);
            }
          } catch (e) {
            formattedEmergency = item.emergency_contact;
          }
        }

        return {
          id: item.id,
          admin_id: item.admin_id,
          user_id: item.user_id,
          first_name: firstName,
          last_name: lastName,
          full_name: fullName,
          email: cleanEmail,
          phone,
          address,
          id_type: idType,
          id_number: idNumber,
          emergency_contact: formattedEmergency || "N/A",
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
        (item.phone && item.phone.toLowerCase().includes(q)) ||
        (item.emergency_contact && item.emergency_contact.toLowerCase().includes(q)) ||
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
  phone?: string;
  address?: string;
  id_type?: string;
  id_number?: string;
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
    
    // Fallback email since DB column cannot be null
    const finalEmail = data.email || `tenant_${Date.now()}_${Math.floor(Math.random() * 10000)}@noemail.local`;

    // Create User record for the tenant
    const user: any = await User.create({
      role: "tenant",
      email: finalEmail,
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
        phone: data.phone || "",
        address: data.address || "",
        id_type: data.id_type || "",
        id_number: data.id_number || "",
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
  } catch (err: any) {
    console.error("DB Error:", err);
    throw err;
  }
}

export async function updateTenant(
  id: number,
  data: Partial<TenantRecord> & { password?: string; phone?: string; address?: string; id_type?: string; id_number?: string; document_url?: string },
  adminId?: number,
) {
  try {
    const whereClause: any = { id };
    if (adminId) whereClause.admin_id = adminId;

    const tenant: any = await Tenant.findOne({ where: whereClause });
    if (tenant) {
      const info = tenant.personal_info_json || {};
      tenant.personal_info_json = {
        ...info,
        first_name: data.first_name !== undefined ? data.first_name : info.first_name,
        last_name: data.last_name !== undefined ? data.last_name : info.last_name,
        phone: data.phone !== undefined ? data.phone : info.phone,
        address: data.address !== undefined ? data.address : info.address,
        id_type: data.id_type !== undefined ? data.id_type : info.id_type,
        id_number: data.id_number !== undefined ? data.id_number : info.id_number,
      };

      if (data.emergency_contact !== undefined) {
        tenant.emergency_contact = data.emergency_contact;
      }
      await tenant.save();

      // Update User email and/or password
      const userUpdateFields: any = {};
      if (data.email !== undefined && data.email.trim()) {
        userUpdateFields.email = data.email.trim();
      }
      if (data.password && data.password.trim()) {
        const hash = await bcrypt.hash(data.password.trim(), 10);
        userUpdateFields.password_hash = hash;
      }
      if (Object.keys(userUpdateFields).length > 0) {
        await User.update(userUpdateFields, { where: { id: tenant.user_id } });
      }

      // Update Contract
      if (data.unit_id || data.move_in_date || 'move_out_date' in data || data.document_url !== undefined) {
        const contract: any = await Contract.findOne({
          where: { tenant_id: id },
        });
        if (contract) {
          const oldUnitId = contract.unit_id;
          const newUnitId = data.unit_id ? Number(data.unit_id) : oldUnitId;

          await contract.update({
            unit_id: newUnitId,
            move_in_date: data.move_in_date || contract.move_in_date,
            move_out_date: 'move_out_date' in data ? (data.move_out_date || null) : contract.move_out_date,
            document_url: data.document_url !== undefined ? data.document_url : contract.document_url,
          });

          // If unit changed, update unit statuses
          if (oldUnitId !== newUnitId) {
            await Unit.update({ status: 'vacant' }, { where: { id: oldUnitId } });
            await Unit.update({ status: 'occupied' }, { where: { id: newUnitId } });
          }
        }
      }

      return tenant.get({ plain: true });
    }
  } catch (err) {
    console.error("updateTenant DB Error:", err);
    throw err;
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

export interface TenantDetailsData {
  tenant: {
    id: number;
    admin_id: number;
    user_id: number;
    first_name: string;
    last_name: string;
    full_name: string;
    email: string;
    phone: string;
    address: string;
    id_type: string;
    id_number: string;
    emergency_contact: string;
    emergency_contact_raw: string;
    status: string;
    created_at?: string;
  };
  contract: {
    id: number;
    move_in_date: string;
    move_out_date: string;
    document_url: string;
  };
  unit: {
    id: number;
    unit_number: string;
    building_id: number;
    building_name: string;
    building_address: string;
    monthly_rent: number;
  };
  billings: Array<{
    id: number;
    reference_number: string;
    billing_type_name: string;
    billing_cycle: string;
    base_amount: number;
    tax_amount: number;
    late_fee_applied: number;
    transfer_fee: number;
    amount: number;
    paid_amount: number;
    balance: number;
    due_date: string;
    status: string;
    created_at?: string;
    collections: Array<{
      id: number;
      amount_paid: number;
      payment_method: string;
      payment_reference?: string;
      collected_date?: string;
      status: string;
      receipt_url?: string;
    }>;
  }>;
  financial_summary: {
    total_billed: number;
    total_paid: number;
    total_balance: number;
  };
  maintenance_tickets: Array<{
    id: number;
    title: string;
    raw_title: string;
    category: string;
    priority: string;
    description: string;
    raw_description: string;
    status: string;
    photos: string[];
    unit_number: string;
    created_at?: string;
    updated_at?: string;
  }>;
  maintenance_summary: {
    total: number;
    open: number;
    in_progress: number;
    resolved: number;
  };
}

export async function getTenantDetails(
  id: number,
  adminId?: number,
): Promise<TenantDetailsData | null> {
  await syncDatabase();
  try {
    const whereClause: any = { id };
    if (adminId) whereClause.admin_id = adminId;

    const dbTenant = await Tenant.findOne({
      where: whereClause,
      include: [
        { model: User },
        {
          model: Contract,
          include: [{ model: Unit, include: [{ model: Building }] }],
        },
      ],
    });

    if (!dbTenant) {
      return null;
    }

    const tenantItem = dbTenant.get({ plain: true });
    const contracts = tenantItem.Contracts || [];
    const latestContract = contracts[contracts.length - 1] || {};
    const infoJson = tenantItem.personal_info_json || {};

    const rawEmail = tenantItem.User?.email;
    const cleanEmail =
      rawEmail && !rawEmail.endsWith("@noemail.local") ? rawEmail : "";
    const firstName = infoJson.first_name || "";
    const lastName = infoJson.last_name || "";
    const fullName =
      firstName || lastName
        ? `${firstName} ${lastName}`.trim()
        : cleanEmail || `Tenant #${tenantItem.id}`;
    const phone = infoJson.phone || "";
    const address = infoJson.address || "";
    const idType = infoJson.id_type || "";
    const idNumber = infoJson.id_number || "";

    // Emergency contact parsing
    let formattedEmergency = tenantItem.emergency_contact || "";
    const emergencyRaw = tenantItem.emergency_contact || "";
    if (formattedEmergency) {
      try {
        const parsed = JSON.parse(formattedEmergency);
        if (typeof parsed === "object" && parsed !== null) {
          const eName = parsed.name || "";
          const ePhone = parsed.phone || "";
          const eRel = parsed.relationship ? ` (${parsed.relationship})` : "";
          if (eName && ePhone) {
            formattedEmergency = `${eName}${eRel}: ${ePhone}`;
          } else if (ePhone) {
            formattedEmergency = ePhone;
          } else if (eName) {
            formattedEmergency = `${eName}${eRel}`;
          }
        } else if (typeof parsed === "number") {
          formattedEmergency = String(parsed);
        }
      } catch (e) {
        formattedEmergency = tenantItem.emergency_contact;
      }
    }

    // Unit & Building
    const unit = latestContract.Unit || null;
    const building = unit?.Building || null;

    // Query Billings for this tenant
    const billingWhere: any = { tenant_id: id };
    if (adminId) billingWhere.admin_id = adminId;

    const dbBillings = await Billing.findAll({
      where: billingWhere,
      include: [{ model: BillingType }, { model: Collection }],
      order: [
        ["due_date", "DESC"],
        ["id", "DESC"],
      ],
    });

    let totalBilled = 0;
    let totalPaid = 0;

    const billings = dbBillings.map((b: any) => {
      const item = b.get({ plain: true });
      const billAmount = Number(item.amount || 0);
      const collections = (item.Collections || []).filter(
        (c: any) => c.status !== "rejected",
      );
      const paidAmount = collections.reduce(
        (acc: number, c: any) => acc + Number(c.amount_paid || 0),
        0,
      );
      const balance = Math.max(0, billAmount - paidAmount);

      totalBilled += billAmount;
      totalPaid += paidAmount;

      let computedStatus = item.status || "draft";
      if (balance <= 0 && billAmount > 0) {
        computedStatus = "paid";
      } else if (new Date(item.due_date) < new Date() && balance > 0) {
        computedStatus = "overdue";
      } else if (paidAmount > 0 && balance > 0) {
        computedStatus = "partially_paid";
      }

      return {
        id: item.id,
        reference_number: `INV-${String(item.id).padStart(5, "0")}`,
        billing_type_name: item.BillingType?.name || "General Bill",
        billing_cycle: item.billing_cycle || "Monthly",
        base_amount: Number(item.base_amount || 0),
        tax_amount: Number(item.tax_amount || 0),
        late_fee_applied: Number(item.late_fee_applied || 0),
        transfer_fee: Number(item.transfer_fee || 0),
        amount: billAmount,
        paid_amount: paidAmount,
        balance,
        due_date: item.due_date,
        status: computedStatus,
        created_at: item.createdAt,
        collections: collections.map((c: any) => ({
          id: c.id,
          amount_paid: Number(c.amount_paid),
          payment_method: c.payment_method,
          payment_reference: c.payment_reference,
          collected_date: c.collected_date || c.createdAt,
          status: c.status,
          receipt_url: c.receipt_url,
        })),
      };
    });

    const totalBalance = Math.max(0, totalBilled - totalPaid);

    // Query Maintenance Tickets for this tenant
    const ticketWhere: any = { tenant_id: id };
    if (adminId) ticketWhere.admin_id = adminId;

    const dbTickets = await MaintenanceTicket.findAll({
      where: ticketWhere,
      include: [{ model: Unit }],
      order: [["id", "DESC"]],
    });

    const maintenanceTickets = dbTickets.map((t: any) => {
      const item = t.get({ plain: true });
      let photos: string[] = [];
      if (Array.isArray(item.photos_json)) {
        photos = item.photos_json;
      } else if (typeof item.photos_json === "string") {
        try {
          photos = JSON.parse(item.photos_json);
        } catch (e) {
          if (item.photos_json.trim()) photos = [item.photos_json.trim()];
        }
      }

      let category = "General";
      let cleanTitle = item.title;
      const catMatch = cleanTitle.match(/^\[(.*?)\]\s*(.*)$/);
      if (catMatch) {
        category = catMatch[1];
        cleanTitle = catMatch[2];
      }

      let priority = "Normal";
      let cleanDescription = item.description || "";
      const prioMatch = cleanDescription.match(
        /^Priority:\s*(\w+)\n\n([\s\S]*)$/,
      );
      if (prioMatch) {
        priority = prioMatch[1];
        cleanDescription = prioMatch[2];
      }

      return {
        id: item.id,
        title: cleanTitle,
        raw_title: item.title,
        category,
        priority,
        description: cleanDescription,
        raw_description: item.description,
        status: item.status,
        photos,
        unit_number: item.Unit?.unit_number || "N/A",
        created_at: item.createdAt,
        updated_at: item.updatedAt,
      };
    });

    const maintenanceSummary = {
      total: maintenanceTickets.length,
      open: maintenanceTickets.filter((t: any) => t.status === "open").length,
      in_progress: maintenanceTickets.filter(
        (t: any) => t.status === "in_progress",
      ).length,
      resolved: maintenanceTickets.filter((t: any) => t.status === "resolved")
        .length,
    };

    return {
      tenant: {
        id: tenantItem.id,
        admin_id: tenantItem.admin_id,
        user_id: tenantItem.user_id,
        first_name: firstName,
        last_name: lastName,
        full_name: fullName,
        email: cleanEmail,
        phone,
        address,
        id_type: idType,
        id_number: idNumber,
        emergency_contact: formattedEmergency || "N/A",
        emergency_contact_raw: emergencyRaw,
        status: tenantItem.User?.status || "active",
        created_at: tenantItem.createdAt,
      },
      contract: {
        id: latestContract.id || 0,
        move_in_date: latestContract.move_in_date || "",
        move_out_date: latestContract.move_out_date || "",
        document_url: latestContract.document_url || "",
      },
      unit: {
        id: unit?.id || 0,
        unit_number: unit?.unit_number || "Unassigned",
        building_id: building?.id || 0,
        building_name: building?.name || "Unassigned Property",
        building_address: building?.address || "",
        monthly_rent: Number(unit?.monthly_rent || 0),
      },
      billings,
      financial_summary: {
        total_billed: totalBilled,
        total_paid: totalPaid,
        total_balance: totalBalance,
      },
      maintenance_tickets: maintenanceTickets,
      maintenance_summary: maintenanceSummary,
    };
  } catch (err) {
    console.error("getTenantDetails DB Error:", err);
    throw err;
  }
}
