import { NextResponse } from "next/server";

export async function GET() {
  try {
    // später kommt hier der echte iCal Import rein

    return NextResponse.json({
      status: "sync completed",
      imported: 0
    });

  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { status: "error" },
      { status: 500 }
    );
  }
}