export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getCollectionById, updateCollection, deleteCollection } from "@/lib/collectionsStore";
import { getAdminIdFromRequest } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const p = await params;
    const adminId = await getAdminIdFromRequest(request);
    const id = Number(p.id);

    const collection = await getCollectionById(id, adminId);
    
    if (!collection) {
      return NextResponse.json(
        { success: false, error: "Collection not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, collection });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch collection" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const p = await params;
    const adminId = await getAdminIdFromRequest(request);
    const id = Number(p.id);
    const body = await request.json();

    const collection = await updateCollection(id, body, adminId);
    return NextResponse.json({ success: true, collection });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update collection" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const p = await params;
    const adminId = await getAdminIdFromRequest(request);
    const id = Number(p.id);

    await deleteCollection(id, adminId);
    return NextResponse.json({ success: true, message: "Collection deleted successfully" });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete collection" },
      { status: 500 }
    );
  }
}
