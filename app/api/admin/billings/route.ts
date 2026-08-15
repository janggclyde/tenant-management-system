export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getBillingsList, createBilling } from "@/lib/billingsStore";
import { getAdminIdFromRequest } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const adminId = await getAdminIdFromRequest(request);
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") || "";
    const status = searchParams.get("status") || "all";
    const billing_type_id = searchParams.get("billing_type_id") || "all";

    const billings = await getBillingsList({ query, status, billing_type_id, admin_id: adminId });
    return NextResponse.json({ success: true, billings });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch billings" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminId = await getAdminIdFromRequest(request);
    const body = await request.json();
    const {
      billing_type_id,
      tenant_id,
      unit_id,
      amount,
      due_date,
      status,
      late_fee_applied,
    } = body;

    // Validation
    if (!billing_type_id || !tenant_id || !amount || !due_date) {
      return NextResponse.json(
        {
          success: false,
          error: "Billing type, tenant, amount, and due date are required.",
        },
        { status: 400 },
      );
    }

    if (isNaN(Number(amount)) || Number(amount) <= 0) {
      return NextResponse.json(
        { success: false, error: "Amount must be a positive number." },
        { status: 400 },
      );
    }

    const baseAmt = Number(body.base_amount || body.amount || 0);

    const newBilling = await createBilling({
      admin_id: adminId,
      billing_type_id: Number(billing_type_id),
      tenant_id: Number(tenant_id),
      unit_id: Number(unit_id || 101),
      base_amount: baseAmt,
      status: "draft",
      custom_due_date: due_date ? String(due_date) : undefined,
      custom_late_fee: late_fee_applied ? Number(late_fee_applied) : undefined,
      meter_readings: body.meter_readings || undefined,
      extra_charges: body.extra_charges || undefined,
    });

    return NextResponse.json(
      { success: true, billing: newBilling },
      { status: 201 },
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to create billing record",
      },
      { status: 500 },
    );
  }
}
