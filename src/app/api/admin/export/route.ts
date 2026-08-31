import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const sessions = await prisma.session.findMany({
      include: {
        participant: true,
        experiment: true,
        condition: true,
        messages: true,
      }
    });

    const csvRows = [
      "session_id,participant_name,experiment,condition,bystander_count,start_time,scenario_triggered,messages_sent,messages_received"
    ];

    for (const s of sessions) {
      const messagesSent = s.messages.filter(m => m.senderType === "PARTICIPANT").length;
      const messagesReceived = s.messages.filter(m => m.senderType !== "PARTICIPANT").length;
      
      csvRows.push(
        `${s.id},${s.participant.name},${s.experiment.name},${s.condition.name},${s.bystanderCount},${s.startTime.toISOString()},${s.status === "SCENARIO_TRIGGERED"},${messagesSent},${messagesReceived}`
      );
    }

    const csvString = csvRows.join("\n");

    return new NextResponse(csvString, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": 'attachment; filename="experiment_data.csv"',
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
