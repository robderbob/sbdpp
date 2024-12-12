const yourRole = require("./instructions/your_role");
const yourJob = require("./instructions/your_job");
const ratingTask = require("./instructions/rating_task");
const dispatchingTask = require("./instructions/dispatching_task");

const getSystemMessage = async (context) => {
  const message = `

    ### YOUR ROLE ###

      ${yourRole}

    ### YOUR JOB ###

      ${yourJob}

    ### WHAT TO DO ON EACH TURN ###

      Your output should always include some thoughts, and then your message to the patient.

      On each turn, please perform the following steps to generate your output:

      1) ${ratingTask}

      2) (only if you have just decided that you have completed your current section; else skip) ${dispatchingTask}

      3) Now output your message to the patient. Be following and completing your current section.

    ### YOUR SCRIPT ###

      ${context.manual}
    
  `;
  return message;
};

module.exports = getSystemMessage;
