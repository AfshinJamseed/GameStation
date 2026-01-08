// Memory Match Game
const grid = document.getElementById('memoryGrid');
const movesElement = document.getElementById('moves');
const timerElement = document.getElementById('timer');
const bestTimeElement = document.getElementById('bestTime');
const resetBtn = document.getElementById('resetBtn');

// Space-themed icons (using emojis)
const icons = ['🌍', '🚀', '🛸', '👽', '🌙', '⭐', '☄️', '🪐'];
let cards = [];
let flippedCards = [];
let matchedPairs = 0;
let moves = 0;
let timer = 0;
let timerInterval = null;
let isProcessing = false;

// Load best time
let bestTime = localStorage.getItem('memoryBestTime') || null;
if (bestTime) {
    bestTimeElement.innerText = formatTime(parseInt(bestTime));
}

// Initialize game
function initGame() {
    // Reset variables
    cards = [];
    flippedCards = [];
    matchedPairs = 0;
    moves = 0;
    timer = 0;
    isProcessing = false;

    movesElement.innerText = moves;
    timerElement.innerText = '0:00';

    // Stop timer if running
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }

    // Create card pairs
    const cardIcons = [...icons, ...icons]; // Duplicate for pairs
    cardIcons.sort(() => Math.random() - 0.5); // Shuffle

    // Clear grid
    grid.innerHTML = '';

    // Create cards
    cardIcons.forEach((icon, index) => {
        const card = document.createElement('div');
        card.classList.add('memory-card');
        card.dataset.icon = icon;
        card.dataset.index = index;

        card.innerHTML = `
            <div class="card-inner">
                <div class="card-front"></div>
                <div class="card-back">${icon}</div>
            </div>
        `;

        card.addEventListener('click', () => flipCard(card));
        grid.appendChild(card);
        cards.push(card);
    });
}

function flipCard(card) {
    // Prevent flipping if processing, already flipped, or already matched
    if (isProcessing || card.classList.contains('flipped') || card.classList.contains('matched')) {
        return;
    }

    // Start timer on first move
    if (moves === 0 && !timerInterval) {
        startTimer();
    }

    // Flip card
    card.classList.add('flipped');
    flippedCards.push(card);

    // Check for match when 2 cards are flipped
    if (flippedCards.length === 2) {
        moves++;
        movesElement.innerText = moves;
        isProcessing = true;

        setTimeout(() => {
            checkMatch();
        }, 800);
    }
}

function checkMatch() {
    const [card1, card2] = flippedCards;

    if (card1.dataset.icon === card2.dataset.icon) {
        // Match!
        card1.classList.add('matched');
        card2.classList.add('matched');
        matchedPairs++;

        // Check if game won
        if (matchedPairs === icons.length) {
            setTimeout(() => {
                gameWon();
            }, 500);
        }
    } else {
        // No match - flip back
        setTimeout(() => {
            card1.classList.remove('flipped');
            card2.classList.remove('flipped');
        }, 500);
    }

    flippedCards = [];
    isProcessing = false;
}

function startTimer() {
    timerInterval = setInterval(() => {
        timer++;
        timerElement.innerText = formatTime(timer);
    }, 1000);
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

async function gameWon() {
    if (matchedPairs === icons.length) { // Changed totalPairs to icons.length to match existing game logic
        clearInterval(timerInterval);
        // Assuming 'gameMessage' element exists in the HTML
        const gameMessageElement = document.getElementById('gameMessage');
        if (gameMessageElement) {
            gameMessageElement.innerText = '🎉 You Won!';
            gameMessageElement.style.display = 'block';
        }

        if (!bestTime || timer < bestTime) {
            bestTime = timer;
            localStorage.setItem('memory_best_time', bestTime); // Updated localStorage key
            bestTimeElement.innerText = formatTime(bestTime); // Added to update display
            // Assuming Modal.alert is defined elsewhere
            await Modal.alert(`🎉 Congratulations! New best time: ${formatTime(timer)}`, '🏆 New Record!');
        } else {
            // Assuming Modal.alert is defined elsewhere
            await Modal.alert(`🎉 You won in ${formatTime(timer)}!`, '🎉 Victory!');
        }
    }
}

// Event listeners
resetBtn.addEventListener('click', initGame);

// Initialize on load
initGame();
