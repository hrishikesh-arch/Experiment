import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { processBotActions } from "@/lib/botEngine";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId");

  if (!sessionId) {
    return NextResponse.json({ error: "Session ID required" }, { status: 400 });
  }

  try {
    // Drive the bots forward
    await processBotActions(sessionId);

    const messages = await prisma.message.findMany({
      where: { sessionId },
      orderBy: { timestamp: "asc" },
    });

    // To include sender names, we might need to join or fetch Participant/Bot profiles
    // For simplicity in this endpoint, we fetch the session to get participant info
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { participant: true },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const formattedMessages = await Promise.all(
      messages.map(async (msg) => {
        let senderName = "Unknown";
        if (msg.senderType === "PARTICIPANT") {
          senderName = session.participant.name;
        } else if (msg.senderType === "BOT") {
          const bot = await prisma.botProfile.findUnique({ where: { id: msg.senderId } });
          senderName = bot?.name || "Bot";
        } else if (msg.senderType === "CREATOR") {
          senderName = "Group Admin";
        }

        return {
          ...msg,
          senderName,
        };
      })
    );

    return NextResponse.json({ messages: formattedMessages });
  } catch (error) {
    console.error("Messages fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
