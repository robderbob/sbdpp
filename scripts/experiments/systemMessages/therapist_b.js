const yourRole = require("./instructions/your_role");
const yourJob = require("./instructions/your_job");

const getSystemMessage = async (context) => {
  const message = `

    ### YOUR ROLE ###

      ${yourRole}

    ### YOUR JOB ###

      ${yourJob}

    ### WHAT TO DO ON EACH TURN ###

      On each turn, please output your message to the patient. Be following and completing your current section.

      Don't output any thoughts.
    
  `;
  return message;
};

module.exports = getSystemMessage;
