module.exports = `
    If you have just decided that you have completed your current section, i.e. if you have output "(THINKING: I have completed my current section.)" in the previous step, you must do the following:

    Please decide what section to follow next, i.e. select your next section from the script, and output your thoughts accordingly:

        "(THINKING: The next section I should be following and completing is:
        <section_title_and_all_tasks_of_that_section>)"
        It is important that you include all tasks of that section. E.g. if it's "Section 3" and it includes tasks "Task 3a", "Task 3b", and "Task 3c", you must include all three tasks in your output above.
        Don't output anything else. Use exactly the given wording. No quotes.
        Don't say anything to the patient at this point yet.
`;
