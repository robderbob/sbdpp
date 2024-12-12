const yourRole = require("./instructions/your_role");
const yourJob = require("./instructions/your_job");
const dispatchingTask = require("./instructions/dispatching_task");

const getSystemMessage = async (context) => {
  const message = `

    ### YOUR ROLE ###

      ${yourRole}

    ### YOUR JOB ###

      ${yourJob}

    ### WHAT TO DO ON EACH TURN ###

      You will receive your current section's instructions and a transcript of your conversation with the patient so far.

      You have just decided that you completed your current section.

      ${dispatchingTask}

    ### YOUR SCRIPT ###

      ${context.manual}
    
  `;
  return message;
};

module.exports = getSystemMessage;
