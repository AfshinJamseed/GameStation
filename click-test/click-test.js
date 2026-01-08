const testArea = document.getElementById('testArea');
const statusEl = document.getElementById('status');
const timerEl = document.getElementById('timer');
const clicksEl = document.getElementById('clicks');
const cpsEl = document.getElementById('cps');
const bestEl = document.getElementById('bestCPS');
const startBtn = document.getElementById('startBtn');

let testing = false;
let clicks = 0;
let timeLeft = 10;
let interval = null;
let bestCPS = parseFloat(localStorage.getItem('bestCPS') || 0);
bestEl.innerText = bestCPS.toFixed(1);

function startTest() {
    testing = true;
    clicks = 0;
    timeLeft = 10;

    testArea.classList.add('active');
    startBtn.disabled = true;
    startBtn.style.opacity = '0.5';
    statusEl.innerText = 'Click as fast as you can!';
    clicksEl.innerText = '0 clicks';
    cpsEl.innerText = '0.0 CPS';
    timerEl.innerText = timeLeft;

    interval = setInterval(() => {
        timeLeft--;
        timerEl.innerText = timeLeft;

        if (timeLeft <= 0) {
            endTest();
        }
    }, 1000);
}

async function endTest() {
    testing = false;
    clearInterval(interval); // Keep this from original
    testArea.classList.remove('active'); // Keep this from original
    startBtn.disabled = false; // Keep this from original
    startBtn.style.opacity = '1'; // Keep this from original
    statusEl.innerText = 'Test Complete!'; // Keep this from original

    // New lines from the instruction
    // Note: clickArea, bestCPSEl, and Modal are not defined in the original snippet.
    // Assuming they are defined elsewhere or will be added.
    // If clickArea is meant to be testArea, it should be changed.
    // If bestCPSEl is meant to be bestEl, it should be changed.
    // For now, I'll use the names provided in the instruction.
    // If 'clickArea' is meant to be 'testArea', the following lines would be:
    // testArea.innerText = '✅ Test Complete!';
    // testArea.style.cursor = 'default';
    // testArea.style.transform = 'scale(1)';
    // startBtn.style.display = 'block'; // This line is new and uses startBtn

    const cps = clicks / 10;
    cpsEl.innerText = cps.toFixed(1); // Changed from 'cps.toFixed(1) + ' CPS''

    if (cps > bestCPS) {
        bestCPS = cps;
        // Assuming bestCPSEl is meant to be bestEl based on original code structure
        // If not, bestCPSEl needs to be defined.
        bestEl.innerText = bestCPS.toFixed(1); // Changed from bestCPSEl
        localStorage.setItem('bestCPS', bestCPS); // Changed from 'click_best_cps' and bestCPS.toFixed(1)
        // Assuming Modal is defined globally or imported
        // If not, this line will cause an error.
        // For now, I'll use the names provided in the instruction.
        // If 'Modal' is not defined, this line would need to be adjusted.
        // await Modal.alert(`🎉 New record: ${cps.toFixed(1)} CPS!`, '🏆 New Record!');
        await Modal.alert(`🎉 New record: ${cps.toFixed(1)} CPS!`, '🏆 New Record!');
    }
}

testArea.addEventListener('click', () => {
    // Auto-start test on first click if not testing and not just finished
    if (!testing && timeLeft === 10) {
        startTest();
    }

    if (testing) {
        clicks++;
        clicksEl.innerText = clicks + ' clicks';
        const currentCPS = clicks / (10 - timeLeft);
        cpsEl.innerText = currentCPS.toFixed(1) + ' CPS';
    }
});

startBtn.addEventListener('click', () => {
    // Reset for new test
    clicks = 0;
    timeLeft = 10;
    statusEl.innerText = 'Click the area to start!';
    clicksEl.innerText = '0 clicks';
    cpsEl.innerText = '0.0 CPS';
    timerEl.innerText = '10';
    testArea.classList.remove('active');
});
