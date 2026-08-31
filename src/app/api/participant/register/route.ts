import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { name, email, phone, groupCode } = await request.json();

    if (!name || !email || !phone || !groupCode) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const experiment = await prisma.experiment.findUnique({
      where: { groupCode },
      include: { conditions: true },
    });

    if (!experiment || experiment.status !== "ACTIVE") {
      return NextResponse.json({ error: "Invalid or inactive experiment" }, { status: 403 });
    }

    // Determine condition (random assignment if multiple)
    let condition;
    if (experiment.conditions.length > 0) {
      const randomIndex = Math.floor(Math.random() * experiment.conditions.length);
      condition = experiment.conditions[randomIndex];
    } else {
      // In a real scenario, there should always be at least one condition.
      return NextResponse.json({ error: "Experiment is misconfigured (no conditions)" }, { status: 500 });
    }

    // Create participant
    const participant = await prisma.participant.create({
      data: {
        name,
        email,
        phone,
      },
    });

    // Create session
    const session = await prisma.session.create({
      data: {
        participantId: participant.id,
        experimentId: experiment.id,
        conditionId: condition.id,
        status: "WAITING", // Or NORMAL_CONVERSATION based on implementation
        randomSeed: Math.random().toString(36).substring(2, 15),
        bystanderCount: condition.bystanderCount,
        activityLevel: condition.activityLevel,
        scenarioDelaySeconds: condition.scenarioDelaySeconds,
      },
    });

    // Log event
    await prisma.eventLog.create({
      data: {
        sessionId: session.id,
        eventType: "SESSION_STARTED",
        details: JSON.stringify({ assignedCondition: condition.name }),
      }
    });

    return NextResponse.json({ success: true, sessionId: session.id });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
