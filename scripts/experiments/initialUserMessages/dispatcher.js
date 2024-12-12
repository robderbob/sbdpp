const getInitialUserMessage = async (context) => {
  const message = `

    Your current section's instructions:

      ${context.sectionInstructions}

    A transcript of your conversation with the patient so far:

      ${context.lastConversationMessages}

    Please decide what section to follow next. Include all tasks from that section in your reply.
    
  `;
  return message;
};

module.exports = getInitialUserMessage;
