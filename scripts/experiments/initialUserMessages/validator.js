const getInitialUserMessage = async (context) => {
  const message = `

    The therapist's last instructions:

      ${context.lastCompletedInstructions}

    A transcript of the therapist's conversation with the patient so far:

      ${context.lastConversationMessages}

    Has the therapist completed their last instructions, and is their last message to the patient coherent?
    
  `;
  return message;
};

module.exports = getInitialUserMessage;
