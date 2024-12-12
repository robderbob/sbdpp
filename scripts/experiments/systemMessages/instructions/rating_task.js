module.exports = `
    Please decide if you have completed your current section in your previous messages, i.e. not including the message that you will send to the patient next. You have completed your current section when you have completed all tasks in that section. Output your thoughts accordingly:

        - If you have completed your current section, output exactly: "(THINKING: I have completed my current section.)"
          Don't output anything else. Use exactly the given wording. No quotes.
          Don't say anything to the patient at this point yet.
          
        - If you have not completed your current section yet, output exactly: "(THINKING: I have not completed my current section yet.)"
          Don't output anything else. Use exactly the given wording. No quotes.
          Don't say anything to the patient at this point yet.
`;
