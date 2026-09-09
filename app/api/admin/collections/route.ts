export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getCollectionsList, createCollection } from "@/lib/collectionsStore";
import { getAdminIdFromRequest } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const adminId = await getAdminIdFromRequest(request);
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") || "";
    const status = searchParams.get("status") || "all";

    const collections = await getCollectionsList({ query, status, admin_id: adminId });
    return NextResponse.json({ success: true, collections });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch collections" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminId = await getAdminIdFromRequest(request);
    const body = await request.json();
    const {
      billing_id,
      amount_paid,
      payment_method,
      collected_date,
      bank_name,
      payment_reference,
      reference_number,
      hitpay_reference,
      status,
      receipt_url
    } = body;

    // Validation
    if (!billing_id || !amount_paid || !payment_method) {
      return NextResponse.json(
        {
          success: false,
          error: "Billing ID, amount paid, and payment method are required.",
        },
        { status: 400 },
      );
    }

    if (isNaN(Number(amount_paid)) || Number(amount_paid) <= 0) {
      return NextResponse.json(
        { success: false, error: "Amount paid must be a positive number." },
        { status: 400 },
      );
    }

    if (payment_method === "bank_transfer" && (!bank_name || !bank_name.trim())) {
      return NextResponse.json(
        {
          success: false,
          error: "Bank name or E-Wallet is required for bank transfer payments.",
        },
        { status: 400 },
      );
    }

    const finalReference = payment_reference || reference_number || hitpay_reference || undefined;

    const newCollection = await createCollection({
      admin_id: adminId,
      billing_id: Number(billing_id),
      amount_paid: Number(amount_paid),
      payment_method,
      bank_name: bank_name ? bank_name.trim() : undefined,
      payment_reference: finalReference,
      hitpay_reference: finalReference,
      collected_date: collected_date || new Date().toISOString().split('T')[0],
      status: status || "completed",
      receipt_url: receipt_url ? receipt_url.trim() : undefined,
    });

    return NextResponse.json(
      { success: true, collection: newCollection },
      { status: 201 },
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to create collection record",
      },
      { status: 500 },
    );
  }
}
