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

    const now = new Date();

    const allSessionMessages = await prisma.message.findMany({
      where: { sessionId },
      orderBy: { timestamp: "asc" },
    });

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { participant: true, condition: true },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const messages = allSessionMessages.filter(m => m.timestamp <= now);
    const futureMessages = allSessionMessages.filter(m => m.timestamp > now);

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

    const typingUsers = await Promise.all(
      futureMessages.map(async (msg) => {
        if (msg.senderType === "BOT") {
          const bot = await prisma.botProfile.findUnique({ where: { id: msg.senderId } });
          return bot?.name || "Bot";
        }
        return "Someone";
      })
    );

    // Filter unique typing users
    const uniqueTyping = Array.from(new Set(typingUsers));

    return NextResponse.json({ 
      messages: formattedMessages,
      participantCount: session.condition.bystanderCount + 1, // bots + 1 real user
      typingUsers: uniqueTyping
    });
  } catch (error) {
    console.error("Messages fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
