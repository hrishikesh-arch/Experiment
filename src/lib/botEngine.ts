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

  // Helper to send a bot message with a future timestamp for natural typing delays
  const sendBotMessage = async (bot: any, text: string, delayMs: number = 0, targetType: string = "NONE", targetId: string | null = null) => {
    await prisma.message.create({
      data: {
        sessionId,
        senderType: "BOT",
        senderId: bot.id,
        messageText: text,
        messageType: "NORMAL",
        targetType,
        targetId,
        timestamp: new Date(Date.now() + delayMs)
      }
    });

    await prisma.eventLog.create({
      data: {
        sessionId,
        eventType: "MESSAGE_SENT",
        details: JSON.stringify({ senderType: "BOT", scheduledFor: delayMs })
      }
    });
  };

  // 1. Initial Sequence Scheduling
  if (session.status === "WAITING" && botMessages.length === 0) {
    // Schedule the entire intro sequence at once with future timestamps
    await sendBotMessage(activeBots[0], "Hey guys, what do you think about the recent push for 'One Nation One Election'? Do you think it's practically feasible in India?", 1000);
    await sendBotMessage(activeBots[1] || activeBots[0], "I think it could save a lot of money and election fatigue, but aligning all state assemblies seems like a logistical nightmare.", 5000);
    await sendBotMessage(activeBots[2] || activeBots[0], "Agreed. Plus, regional parties might be at a huge disadvantage if national issues overshadow local state issues during a single vote.", 9500);
    await sendBotMessage(activeBots[3] || activeBots[0], "True, but the current system means we are perpetually in campaign mode which halts policy making. There has to be a middle ground.", 14500);
    await sendBotMessage(activeBots[4] || activeBots[0], `@${participantName}, what do you think about this? Do you support it?`, 18000, "PARTICIPANT", session.participantId);
    await sendBotMessage(activeBots[5] || activeBots[0], `Yeah @${participantName}, tell us your thoughts!`, 20000, "PARTICIPANT", session.participantId);
    await sendBotMessage(activeBots[6] || activeBots[0], `I'm curious to hear your take too.`, 22500, "PARTICIPANT", session.participantId);
    
    await prisma.session.update({
      where: { id: sessionId },
      data: { status: "AWAITING_POLITICS_REPLY" }
    });
    return;
  }

  // 2. Handle participant reply to the intro sequence
  if (session.status === "AWAITING_POLITICS_REPLY" && participantMessages.length > 0) {
    // Ensure we only process if they actually replied AFTER the final bot question
    const lastBotMsg = botMessages[botMessages.length - 1];
    const lastParticipantMsg = participantMessages[participantMessages.length - 1];
    
    if (lastBotMsg && lastParticipantMsg.timestamp > lastBotMsg.timestamp) {
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

      // Schedule the reply 3 seconds in the future
      await sendBotMessage(activeBots[0], replyText, 3000, "PARTICIPANT", session.participantId);

      // Move to normal conversation
      await prisma.session.update({
        where: { id: sessionId },
        data: { status: "NORMAL_CONVERSATION" }
      });
    }
  }

  // 3. Normal Conversation / Scenario Logic
  if (session.status === "NORMAL_CONVERSATION") {
    const scenarioTargetTime = session.scenarioDelaySeconds * 1000;
    
    // Check if it's time for the scenario
    if (elapsedSinceStart >= scenarioTargetTime) {
      await prisma.session.update({
        where: { id: sessionId },
        data: { status: "SCENARIO_TRIGGERED" }
      });
      // Schedule the scenario messages
      await sendBotMessage(activeBots[0], "Guys, I think I might need some help with something.", 2000);
      await sendBotMessage(activeBots[1] || activeBots[0], "What happened?", 7000);
      await sendBotMessage(activeBots[0], "I'm having trouble figuring this out. Maybe someone here knows?", 12000);
      return;
    }

    // Generic random chatter every 20-30 seconds
    const lastBotMessage = botMessages[botMessages.length - 1];
    const timeSinceLastMessage = lastBotMessage ? now.getTime() - lastBotMessage.timestamp.getTime() : 0;
    
    // Check if there's no future messages currently scheduled
    const hasFutureMessages = botMessages.some(m => m.timestamp.getTime() > now.getTime());
    
    if (timeSinceLastMessage > 20000 && !hasFutureMessages) {
      const topics = [
        "Has anyone started the assignment?",
        "When is the project due?",
        "It's too hot today 😭",
        "Anyone want to grab food later?",
        "Is anyone good at coding here?"
      ];
      const replyText = topics[Math.floor(Math.random() * topics.length)];
      const bot = activeBots[Math.floor(Math.random() * activeBots.length)];
      
      // Schedule a message and a potential reply
      await sendBotMessage(bot, replyText, 2000);
      
      if (Math.random() > 0.5) {
        const replyBot = activeBots.find(b => b.id !== bot.id) || activeBots[0];
        const replies = ["Not yet", "Same", "No idea"];
        await sendBotMessage(replyBot, replies[Math.floor(Math.random() * replies.length)], 7000);
      }
    }
  }
}
