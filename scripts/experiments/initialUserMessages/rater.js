const getInitialUserMessage = async (context) => {
  const message = `

    Your current section's instructions:

      ${context.sectionInstructions}

    A transcript of your conversation with the patient so far:

      ${context.lastConversationMessages}

    Please decide if you have just completed your current section, and reply accordingly.
    
  `;
  return message;
};

module.exports = getInitialUserMessage;
