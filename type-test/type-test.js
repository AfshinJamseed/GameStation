const textDisplay = document.getElementById('textDisplay');
const typingInput = document.getElementById('typingInput');
const timerEl = document.getElementById('timer');
const wpmEl = document.getElementById('wpm');
const accuracyEl = document.getElementById('accuracy');
const bestEl = document.getElementById('bestWPM');
const startBtn = document.getElementById('startBtn');

const sampleTexts = [
    "The quick brown fox jumps over the lazy dog near the riverbank where children play.",
    "Space exploration has always fascinated humanity with its mysteries and endless possibilities.",
    "Technology continues to evolve at an unprecedented pace changing how we live and work.",
    "The stars above shine bright guiding travelers through the dark cosmic wilderness tonight.",
    "Learning new skills requires patience practice and dedication to achieve mastery over time."
];

let currentText = '';
let timeLeft = 60;
let timer = null;
let testing = false;
let timerStarted = false;
let correctChars = 0;
let totalChars = 0;
let bestWPM = parseInt(localStorage.getItem('bestWPM') || 0);
bestEl.innerText = bestWPM;

function startTest() {
    testing = true;
    timeLeft = 60;
    correctChars = 0;
    totalChars = 0;
    timerStarted = false; // Flag to start timer on first keystroke

    currentText = sampleTexts[Math.floor(Math.random() * sampleTexts.length)];
    textDisplay.innerHTML = currentText.split('').map(char =>
        `<span>${char}</span>`
    ).join('');

    typingInput.value = '';
    typingInput.disabled = false;
    typingInput.focus();

    startBtn.disabled = true;
    startBtn.style.opacity = '0.5';
}

function updateWPM() {
    const timeElapsed = (60 - timeLeft) / 60;
    if (timeElapsed > 0) {
        const wpm = Math.round((correctChars / 5) / timeElapsed);
        wpmEl.innerText = wpm;
    }
}

async function endTest() {
    testing = false;
    clearInterval(timer);

    typingInput.disabled = true;
    startBtn.disabled = false;
    startBtn.style.opacity = '1';

    const finalWPM = parseInt(wpmEl.innerText);

    // Check for new record
    if (finalWPM > bestWPM) {
        bestWPM = finalWPM;
        localStorage.setItem('bestWPM', bestWPM);
        bestEl.innerText = bestWPM;
        await Modal.alert(`🎉 New record: ${finalWPM} WPM!`, '🏆 New Record!');
    }
}

typingInput.addEventListener('input', () => {
    if (!testing) return;

    // Start timer on first keystroke
    if (!timerStarted) {
        timerStarted = true;
        timer = setInterval(() => {
            timeLeft--;
            timerEl.innerText = timeLeft;
            updateWPM();

            if (timeLeft <= 0) {
                endTest();
            }
        }, 1000);
    }

    const typed = typingInput.value;
    totalChars = typed.length;
    correctChars = 0;

    const spans = textDisplay.querySelectorAll('span');

    spans.forEach((span, index) => {
        span.classList.remove('correct', 'incorrect', 'current');

        if (index < typed.length) {
            if (typed[index] === currentText[index]) {
                span.classList.add('correct');
                correctChars++;
            } else {
                span.classList.add('incorrect');
            }
        } else if (index === typed.length) {
            span.classList.add('current');
        }
    });

    // Update accuracy
    const acc = totalChars > 0 ? Math.round((correctChars / totalChars) * 100) : 100;
    accuracyEl.innerText = acc;

    // Update WPM
    updateWPM();

    // Check if completed
    if (typed.length >= currentText.length) {
        endTest();
    }
});

startBtn.addEventListener('click', startTest);
