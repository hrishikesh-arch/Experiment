import { prisma } from "./prisma";

// Serverless-compatible Bot Engine (Stateless, driven by polling)
export async function processBotActions(sessionId: string) {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { condition: true, participant: true }
  });

  if (!session || session.status === "COMPLETED") return;

  const allBots = await prisma.botProfile.findMany();
  const activeBots = allBots.slice(0, session.condition.bystanderCount);
  const participantName = session.participant.name;
  
  const messages = await prisma.message.findMany({
    where: { sessionId },
    orderBy: { timestamp: "asc" }
  });

  const botMessages = messages.filter(m => m.senderType === "BOT");
  const participantMessages = messages.filter(m => m.senderType === "PARTICIPANT");

  const now = new Date();
  const elapsedSinceStart = now.getTime() - session.startTime.getTime();

  // Helper to send a bot message synchronously
  const sendBotMessage = async (bot: any, text: string, targetType: string = "NONE", targetId: string | null = null) => {
    await prisma.message.create({
      data: {
        sessionId,
        senderType: "BOT",
        senderId: bot.id,
        messageText: text,
        messageType: "NORMAL",
        targetType,
        targetId,
      }
    });

    await prisma.eventLog.create({
      data: {
        sessionId,
        eventType: "MESSAGE_SENT",
        details: JSON.stringify({ senderType: "BOT" })
      }
    });
  };

  if (session.status === "WAITING") {
    // 1. Spontaneous first message (after 1s)
    if (elapsedSinceStart >= 1000 && botMessages.length === 0) {
      await sendBotMessage(activeBots[0], "Hey guys, what do you think about the recent push for 'One Nation One Election'? Do you think it's practically feasible in India?");
    }
    // 2. Second message (after 5s)
    else if (elapsedSinceStart >= 5000 && botMessages.length === 1) {
      await sendBotMessage(activeBots[1] || activeBots[0], "I think it could save a lot of money and election fatigue, but aligning all state assemblies seems like a logistical nightmare.");
    }
    // 3. Third message (after 9.5s)
    else if (elapsedSinceStart >= 9500 && botMessages.length === 2) {
      await sendBotMessage(activeBots[2] || activeBots[0], "Agreed. Plus, regional parties might be at a huge disadvantage if national issues overshadow local state issues during a single vote.");
    }
    // 4. Fourth message (after 14.5s)
    else if (elapsedSinceStart >= 14500 && botMessages.length === 3) {
      await sendBotMessage(activeBots[3] || activeBots[0], "True, but the current system means we are perpetually in campaign mode which halts policy making. There has to be a middle ground.");
    }
    // 5. Fifth message (after 18s) - Targeting participant
    else if (elapsedSinceStart >= 18000 && botMessages.length === 4) {
      await sendBotMessage(activeBots[4] || activeBots[0], `@${participantName}, what do you think about this? Do you support it?`, "PARTICIPANT", session.participantId);
    }
    // 6. Sixth message (after 20s)
    else if (elapsedSinceStart >= 20000 && botMessages.length === 5) {
      await sendBotMessage(activeBots[5] || activeBots[0], `Yeah @${participantName}, tell us your thoughts!`, "PARTICIPANT", session.participantId);
    }
    // 7. Seventh message (after 22.5s)
    else if (elapsedSinceStart >= 22500 && botMessages.length === 6) {
      await sendBotMessage(activeBots[6] || activeBots[0], `I'm curious to hear your take too.`, "PARTICIPANT", session.participantId);
      
      // Update session status so it waits for participant reply
      await prisma.session.update({
        where: { id: sessionId },
        data: { status: "AWAITING_POLITICS_REPLY" }
      });
    }
  }

  // Handle participant reply to the intro sequence
  if (session.status === "AWAITING_POLITICS_REPLY" && participantMessages.length > 0) {
    const lastParticipantMsg = participantMessages[participantMessages.length - 1];
    const timeSinceReply = now.getTime() - lastParticipantMsg.timestamp.getTime();

    // Give a 3-second delay after they reply before the bot responds
    if (timeSinceReply >= 3000 && botMessages.length === 7) {
      const lowerText = lastParticipantMsg.messageText.toLowerCase();
      let replyText = "";
      
      if (lowerText.includes("yes") || lowerText.includes("support") || lowerText.includes("agree")) {
        replyText = "Interesting! Yeah, the reduced election fatigue is definitely a huge plus.";
      } else if (lowerText.includes("no") || lowerText.includes("disagree") || lowerText.includes("don't think")) {
        replyText = "Makes sense. The logistical and constitutional hurdles are massive.";
      } else {
        if (lastParticipantMsg.messageText.length > 30) {
          replyText = "That's a really nuanced way to look at it. There are definitely pros and cons.";
        } else {
          replyText = "Fair point!";
        }
      }

      await sendBotMessage(activeBots[0], replyText, "PARTICIPANT", session.participantId);

      // Move to normal conversation
      await prisma.session.update({
        where: { id: sessionId },
        data: { status: "NORMAL_CONVERSATION" }
      });
    }
  }

  // Normal Conversation / Scenario Logic
  if (session.status === "NORMAL_CONVERSATION") {
    const scenarioTargetTime = session.scenarioDelaySeconds * 1000;
    
    // Check if it's time for the scenario
    if (elapsedSinceStart >= scenarioTargetTime) {
      await prisma.session.update({
        where: { id: sessionId },
        data: { status: "SCENARIO_TRIGGERED" }
      });
      await sendBotMessage(activeBots[0], "Guys, I think I might need some help with something.");
      return;
    }

    // Generic random chatter every 20 seconds
    const lastBotMessage = botMessages[botMessages.length - 1];
    const timeSinceLastMessage = lastBotMessage ? now.getTime() - lastBotMessage.timestamp.getTime() : 0;
    
    if (timeSinceLastMessage > 20000) {
      const topics = [
        "Has anyone started the assignment?",
        "When is the project due?",
        "It's too hot today 😭",
        "Anyone want to grab food later?",
      ];
      const replyText = topics[Math.floor(Math.random() * topics.length)];
      const bot = activeBots[Math.floor(Math.random() * activeBots.length)];
      await sendBotMessage(bot, replyText);
    }
  }

  // Handle Scenario progression
  if (session.status === "SCENARIO_TRIGGERED") {
    // Basic scenario progression
    const scenarioStartTime = botMessages.find(m => m.messageText.includes("need some help"))?.timestamp.getTime() || now.getTime();
    const elapsedSinceScenario = now.getTime() - scenarioStartTime;
    
    const scenarioMsgCount = botMessages.filter(m => m.timestamp.getTime() >= scenarioStartTime).length;

    if (elapsedSinceScenario >= 4000 && scenarioMsgCount === 1) {
      await sendBotMessage(activeBots[1] || activeBots[0], "What happened?");
    } else if (elapsedSinceScenario >= 9000 && scenarioMsgCount === 2) {
      await sendBotMessage(activeBots[0], "I'm having trouble figuring this out. Maybe someone here knows?");
    }
  }
}
