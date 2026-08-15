import { NextResponse } from "next/server";
import sequelize from "../../../../db/models";

export async function GET() {
  try {
    await sequelize.query("SELECT 1");

    return NextResponse.json({
      success: true,
      message: "Database is alive",
    });
  } catch (error) {
    console.error("Database keep-alive failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Database connection failed",
      },
      { status: 500 },
    );
  }
}
