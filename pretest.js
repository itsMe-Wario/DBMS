const correctAnswers = ["pretest-1b", "pretest-2c", "pretest-3b", "pretest-4d", "pretest-5b"];
const beginnerCheckbox = document.getElementById("difficulty-beginner");
const advancedCheckbox = document.getElementById("difficulty-advanced");

document.getElementById("submit-button").addEventListener("click", function() {
    let score = 0;
    let totalQuestions = 0;

    const answerInputs = document.querySelectorAll('input[type="radio"]:checked');
    
    answerInputs.forEach(function(answerInput) {
        const questionNumber = answerInput.name.charAt(answerInput.name.length - 1);
        const userAnswer = answerInput.value;
        const questionDifficulty = document.querySelector(`.pretest-question${questionNumber}`).classList;

        if (questionDifficulty.contains('pretest-beginner') && beginnerCheckbox.checked) {
            totalQuestions++;
            const correctAnswer = correctAnswers[questionNumber - 1];

            if (correctAnswer && correctAnswer === userAnswer) {
                score++;
            }
        } else if (questionDifficulty.contains('pretest-advanced') && advancedCheckbox.checked) {
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
    const beginnerQuestions = document.querySelectorAll('.pretest-beginner');
    const advancedQuestions = document.querySelectorAll('.pretest-advanced');

    beginnerQuestions.forEach(question => {
        question.style.display = beginnerCheckbox.checked ? 'block' : 'none';
    });

    advancedQuestions.forEach(question => {
        question.style.display = advancedCheckbox.checked ? 'block' : 'none';
    });
}

toggleQuestions();