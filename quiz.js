const correctAnswers = ["posttest-1a", "posttest-2a", "posttest-3c", "posttest-4b", "posttest-5d"];
const beginnerCheckbox = document.getElementById("difficulty-beginner");
const advancedCheckbox = document.getElementById("difficulty-advanced");

document.getElementById("submit-button").addEventListener("click", function() {
    let score = 0;
    let totalQuestions = 0;

    const answerInputs = document.querySelectorAll('input[type="radio"]:checked');
    
    answerInputs.forEach(function(answerInput) {
        const questionNumber = answerInput.name.charAt(answerInput.name.length - 1);
        const userAnswer = answerInput.value;
        const questionElement = document.querySelector(`.posttest-question${questionNumber}`);
        const questionDifficulty = questionElement.classList;

        if (questionDifficulty.contains('posttest-beginner') && beginnerCheckbox.checked) {
            totalQuestions++;
            const correctAnswer = correctAnswers[questionNumber - 1];

            if (correctAnswer && correctAnswer === userAnswer) {
                score++;
            }
        } else if (questionDifficulty.contains('posttest-advanced') && advancedCheckbox.checked) {
            totalQuestions++;
            const correctAnswer = correctAnswers[questionNumber - 1];

            if (correctAnswer && correctAnswer === userAnswer) {
                score++;
            }
        }
    });

    const resultContainer = document.getElementById("result-container");
    const maxScore = (beginnerCheckbox.checked ? 3 : 0) + (advancedCheckbox.checked ? 2 : 0);
    resultContainer.textContent = `Your score is: ${score} out of ${totalQuestions} (Maximum possible score: ${maxScore})`;
});

beginnerCheckbox.addEventListener("change", toggleQuestions);
advancedCheckbox.addEventListener("change", toggleQuestions);

function toggleQuestions() {
    const beginnerQuestions = document.querySelectorAll('.posttest-beginner');
    const advancedQuestions = document.querySelectorAll('.posttest-advanced');

    beginnerQuestions.forEach(question => {
        question.style.display = beginnerCheckbox.checked ? 'block' : 'none';
    });

    advancedQuestions.forEach(question => {
        question.style.display = advancedCheckbox.checked ? 'block' : 'none';
    });
}

toggleQuestions();