import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { sessionId, senderType, messageText, senderId: providedSenderId } = await request.json();

    if (!sessionId || !senderType || !messageText) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { participant: true },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    let senderId = providedSenderId;
    let senderName = "Unknown";

    if (senderType === "PARTICIPANT") {
      senderId = session.participantId;
      senderName = session.participant.name;
    } else if (senderType === "BOT") {
       const bot = await prisma.botProfile.findUnique({ where: { id: senderId } });
       senderName = bot?.name || "Bot";
    }

    const message = await prisma.message.create({
      data: {
        sessionId,
        senderType,
        senderId,
        messageText,
        messageType: "NORMAL",
      },
    });

    // Log the event
    await prisma.eventLog.create({
      data: {
        sessionId,
        eventType: senderType === "PARTICIPANT" ? "MESSAGE_SENT" : "MESSAGE_RECEIVED",
        details: JSON.stringify({ messageId: message.id }),
      }
    });

    return NextResponse.json({ success: true, message });
  } catch (error) {
    console.error("Send message error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
