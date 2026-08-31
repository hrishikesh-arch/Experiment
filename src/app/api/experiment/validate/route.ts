import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { groupCode } = await request.json();

    if (!groupCode) {
      return NextResponse.json({ error: "Group code is required" }, { status: 400 });
    }

    const experiment = await prisma.experiment.findUnique({
      where: { groupCode },
    });

    if (!experiment) {
      return NextResponse.json({ error: "We couldn't find that group code. Please check the code and try again." }, { status: 404 });
    }

    if (experiment.status !== "ACTIVE") {
      return NextResponse.json({ error: "This experiment is no longer accepting participants." }, { status: 403 });
    }

    return NextResponse.json({ success: true, experimentId: experiment.id });
  } catch (error) {
    console.error("Validation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
