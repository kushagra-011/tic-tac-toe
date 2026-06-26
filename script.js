/* ==========================================
   NEON TIC TAC TOE GAME ENGINE & EFFECTS
   ========================================== */

// --- Global States ---
let boardState = Array(9).fill('');
let isGameActive = true;
let currentPlayer = 'X'; // 'X' always starts
let gameMode = 'pvp'; // 'pvp' or 'ai'
let aiDifficulty = 'medium'; // 'easy', 'medium', 'unbeatable'
let isMuted = false;
let scores = {
    pvp: { x: 0, o: 0, ties: 0 },
    ai: { x: 0, o: 0, ties: 0 } // 'x' is player, 'o' is computer
};

// --- DOM Elements ---
const cells = document.querySelectorAll('.cell');
const board = document.getElementById('board');
const turnIndicator = document.getElementById('turn-indicator');
const turnText = document.getElementById('turn-text');
const winningLine = document.getElementById('winning-line');
const soundToggleBtn = document.getElementById('sound-toggle');

const modePvPBtn = document.getElementById('mode-pvp');
const modeAiBtn = document.getElementById('mode-ai');
const aiDifficultyContainer = document.getElementById('ai-difficulty-container');
const difficultyBtns = document.querySelectorAll('.diff-btn');

const scoreXVal = document.getElementById('score-x');
const scoreOVal = document.getElementById('score-o');
const scoreTiesVal = document.getElementById('score-ties');
const scoreXCard = document.getElementById('score-x-card');
const scoreOCard = document.getElementById('score-o-card');
const playerOLabel = document.getElementById('player-o-label');

const resetBoardBtn = document.getElementById('reset-board');
const resetScoresBtn = document.getElementById('reset-scores');

// Overlay elements
const gameOverOverlay = document.getElementById('game-over-overlay');
const overlayTitle = document.getElementById('overlay-title');
const winnerDisplay = document.getElementById('winner-display');
const overlaySubtitle = document.getElementById('overlay-subtitle');
const playAgainBtn = document.getElementById('overlay-play-again');

// Confetti Canvas
const canvas = document.getElementById('confetti-canvas');
const ctx = canvas.getContext('2d');
let confettiParticles = [];
let animationId = null;

// --- Sound Synthesizer (Web Audio API) ---
let audioCtx = null;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
}

function playTone(freq, type, duration, slideTo = 0) {
    if (isMuted) return;
    initAudio();
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

    if (slideTo > 0) {
        osc.frequency.exponentialRampToValueAtTime(slideTo, audioCtx.currentTime + duration);
    }

    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + duration);
}

function playSound(action) {
    switch (action) {
        case 'x-move':
            playTone(400, 'triangle', 0.12, 650);
            break;
        case 'o-move':
            playTone(300, 'sine', 0.12, 450);
            break;
        case 'click':
            playTone(600, 'sine', 0.05, 300);
            break;
        case 'win':
            // High energy arpeggio
            setTimeout(() => playTone(261.63, 'triangle', 0.15), 0); // C4
            setTimeout(() => playTone(329.63, 'triangle', 0.15), 100); // E4
            setTimeout(() => playTone(392.00, 'triangle', 0.15), 200); // G4
            setTimeout(() => playTone(523.25, 'sine', 0.35, 783.99), 300); // C5 -> G5
            break;
        case 'draw':
            // Sad descension
            setTimeout(() => playTone(220.00, 'sine', 0.2), 0); // A3
            setTimeout(() => playTone(207.65, 'sine', 0.2), 150); // G#3
            setTimeout(() => playTone(196.00, 'sine', 0.4, 150), 300); // G3 -> Eb3
            break;
    }
}

// --- Confetti Particle System ---
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

class Confetti {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = canvas.height + Math.random() * 20;
        this.size = Math.random() * 6 + 4;
        this.color = `hsl(${Math.random() * 360}, 80%, 60%)`;
        this.speedX = Math.random() * 6 - 3;
        this.speedY = -(Math.random() * 10 + 10);
        this.gravity = 0.25;
        this.rotation = Math.random() * 360;
        this.rotationSpeed = Math.random() * 4 - 2;
        this.opacity = 1;
    }

    update() {
        this.x += this.speedX;
        this.speedY += this.gravity;
        this.y += this.speedY;
        this.rotation += this.rotationSpeed;
        if (this.y > canvas.height - 100 && this.speedY > 0) {
            this.opacity -= 0.015;
        }
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate((this.rotation * Math.PI) / 180);
        ctx.globalAlpha = this.opacity;
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
        ctx.restore();
    }
}

function startConfetti() {
    confettiParticles = [];
    // Spawn initial particles from bottom left and right
    for (let i = 0; i < 150; i++) {
        setTimeout(() => {
            const p = new Confetti();
            // Bias spawn point towards screen edges to look like firecrackers
            if (Math.random() > 0.5) {
                p.x = Math.random() * (canvas.width * 0.15);
                p.speedX = Math.random() * 5 + 3;
            } else {
                p.x = canvas.width - (Math.random() * (canvas.width * 0.15));
                p.speedX = -(Math.random() * 5 + 3);
            }
            confettiParticles.push(p);
        }, Math.random() * 400);
    }
    animateConfetti();
}

function animateConfetti() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    confettiParticles = confettiParticles.filter(p => p.opacity > 0 && p.y < canvas.height + 50);
    confettiParticles.forEach(p => {
        p.update();
        p.draw();
    });

    if (confettiParticles.length > 0) {
        animationId = requestAnimationFrame(animateConfetti);
    } else {
        cancelAnimationFrame(animationId);
    }
}

// --- Winning Combinations ---
const WINNING_COMBOS = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
    [0, 4, 8], [2, 4, 6]             // Diagonals
];

// --- Core Game Initialization ---
function loadScores() {
    const savedScores = localStorage.getItem('neon_ttt_scores');
    if (savedScores) {
        scores = JSON.parse(savedScores);
    }
    updateScoreboardDisplay();
}

function saveScores() {
    localStorage.setItem('neon_ttt_scores', JSON.stringify(scores));
}

function updateScoreboardDisplay() {
    const currentScores = scores[gameMode];
    scoreXVal.textContent = currentScores.x;
    scoreOVal.textContent = currentScores.o;
    scoreTiesVal.textContent = currentScores.ties;
}

function updateTurnDisplay() {
    cells.forEach(cell => {
        // Remove old previews
        cell.classList.remove('preview-x', 'preview-o');
        if (!cell.disabled && isGameActive) {
            // Add preview based on current turn
            cell.classList.add(currentPlayer === 'X' ? 'preview-x' : 'preview-o');
        }
    });

    if (currentPlayer === 'X') {
        turnText.innerHTML = `<i class="fas fa-times"></i> X's Turn`;
        turnText.className = 'player-turn x-accent';
        scoreXCard.classList.add('active-turn');
        scoreOCard.classList.remove('active-turn');
    } else {
        const oName = gameMode === 'ai' ? 'CPU' : "O";
        turnText.innerHTML = `<i class="far fa-circle"></i> ${oName}'s Turn`;
        turnText.className = 'player-turn o-accent';
        scoreOCard.classList.add('active-turn');
        scoreXCard.classList.remove('active-turn');
    }
}

// --- Game Over Overlay Controls ---
function showGameOver(type, winningCombo = null) {
    isGameActive = false;
    // Disable hover previews
    cells.forEach(cell => cell.classList.remove('preview-x', 'preview-o'));

    if (type === 'draw') {
        playSound('draw');
        overlayTitle.textContent = "It's a Draw!";
        overlayTitle.className = "overlay-title o-accent"; // neutral glowing mix
        winnerDisplay.innerHTML = `<i class="fas fa-handshake x-accent" style="text-shadow: 0 0 20px var(--color-x-glow);"></i>`;
        overlaySubtitle.textContent = "A battle of wits, neither player yielded.";
        scores[gameMode].ties++;
    } else {
        playSound('win');
        const winner = type;
        if (winner === 'X') {
            overlayTitle.textContent = "Victory!";
            overlayTitle.className = "overlay-title x-accent";
            winnerDisplay.innerHTML = `<i class="fas fa-times x-accent"></i>`;
            overlaySubtitle.textContent = gameMode === 'ai' ? "You defeated the Computer!" : "Player X claims the crown!";
            scores[gameMode].x++;
        } else {
            overlayTitle.textContent = gameMode === 'ai' ? "Defeat!" : "Victory!";
            overlayTitle.className = "overlay-title o-accent";
            winnerDisplay.innerHTML = `<i class="far fa-circle o-accent"></i>`;
            overlaySubtitle.textContent = gameMode === 'ai' ? "The Computer plays flawlessly." : "Player O claims the crown!";
            scores[gameMode].o++;
        }
        
        // Draw physical winning line
        if (winningCombo) {
            drawWinningLine(winningCombo, winner);
        }
        
        // Run confetti celebration
        startConfetti();
    }

    saveScores();
    updateScoreboardDisplay();

    // Show Overlay with slight delay for visuals to sink in
    setTimeout(() => {
        gameOverOverlay.classList.remove('hidden');
    }, 900);
}

function drawWinningLine(combo, winner) {
    const startCell = cells[combo[0]];
    const endCell = cells[combo[2]];
    const startRect = startCell.getBoundingClientRect();
    const endRect = endCell.getBoundingClientRect();
    const boardRect = board.getBoundingClientRect();

    const x1 = startRect.left + startRect.width / 2 - boardRect.left;
    const y1 = startRect.top + startRect.height / 2 - boardRect.top;
    const x2 = endRect.left + endRect.width / 2 - boardRect.left;
    const y2 = endRect.top + endRect.height / 2 - boardRect.top;

    const distance = Math.hypot(x2 - x1, y2 - y1);
    const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;

    winningLine.style.left = `${x1}px`;
    winningLine.style.top = `${y1}px`;
    
    // Set color
    winningLine.className = 'winning-line';
    winningLine.classList.add(winner === 'X' ? 'x-win' : 'o-win');

    // Trigger transition width
    requestAnimationFrame(() => {
        winningLine.style.transform = `rotate(${angle}deg)`;
        winningLine.style.transformOrigin = 'left center';
        winningLine.style.width = `${distance}px`;
        winningLine.style.opacity = '1';
    });
}

function clearWinningLine() {
    winningLine.style.opacity = '0';
    winningLine.style.width = '0';
}

// --- Check for Game Winner ---
function checkWinner(state) {
    for (let combo of WINNING_COMBOS) {
        const [a, b, c] = combo;
        if (state[a] && state[a] === state[b] && state[a] === state[c]) {
            return { winner: state[a], combo };
        }
    }
    if (state.every(cell => cell !== '')) {
        return { winner: 'draw', combo: null };
    }
    return null;
}

// --- Player Move Handler ---
function handleCellClick(e) {
    const cell = e.currentTarget;
    const idx = parseInt(cell.dataset.index);

    if (boardState[idx] !== '' || !isGameActive) return;

    makeMove(idx, currentPlayer);

    const result = checkWinner(boardState);
    if (result) {
        showGameOver(result.winner, result.combo);
        return;
    }

    // Switch turn
    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    updateTurnDisplay();

    // Trigger AI if computer mode
    if (gameMode === 'ai' && currentPlayer === 'O' && isGameActive) {
        // Disable board interactions while AI thinks
        setBoardInteraction(false);
        setTimeout(makeAIMove, 600); // 600ms artificial delay to look "natural"
    }
}

function makeMove(index, player) {
    boardState[index] = player;
    const cell = cells[index];
    cell.disabled = true;

    // Pop the icon in
    if (player === 'X') {
        cell.innerHTML = '<i class="fas fa-times"></i>';
        playSound('x-move');
    } else {
        cell.innerHTML = '<i class="far fa-circle"></i>';
        playSound('o-move');
    }
}

function setBoardInteraction(active) {
    cells.forEach(cell => {
        if (boardState[parseInt(cell.dataset.index)] === '') {
            cell.disabled = !active;
        }
    });
}

// --- Artificial Intelligence Implementation ---
function makeAIMove() {
    if (!isGameActive) return;

    let targetIndex;

    if (aiDifficulty === 'easy') {
        targetIndex = getRandomMove();
    } else if (aiDifficulty === 'medium') {
        targetIndex = getMediumMove();
    } else {
        targetIndex = getUnbeatableMove();
    }

    makeMove(targetIndex, 'O');

    const result = checkWinner(boardState);
    if (result) {
        showGameOver(result.winner, result.combo);
        setBoardInteraction(true);
        return;
    }

    currentPlayer = 'X';
    updateTurnDisplay();
    setBoardInteraction(true);
}

// 1. Easy Mode: Random empty spot
function getRandomMove() {
    const emptyIndices = boardState.map((val, idx) => val === '' ? idx : null).filter(val => val !== null);
    return emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
}

// 2. Medium Mode: Smart but beatable heuristic check
function getMediumMove() {
    // A. Check if AI can win immediately
    for (let i = 0; i < 9; i++) {
        if (boardState[i] === '') {
            boardState[i] = 'O';
            const win = checkWinner(boardState);
            boardState[i] = '';
            if (win && win.winner === 'O') return i;
        }
    }

    // B. Check if Player can win immediately and block
    for (let i = 0; i < 9; i++) {
        if (boardState[i] === '') {
            boardState[i] = 'X';
            const win = checkWinner(boardState);
            boardState[i] = '';
            if (win && win.winner === 'X') return i;
        }
    }

    // C. 60% Perfect move, 40% Random move
    if (Math.random() < 0.6) {
        return getUnbeatableMove();
    }

    return getRandomMove();
}

// 3. Unbeatable Mode: Minimax
function getUnbeatableMove() {
    let bestScore = -Infinity;
    let move = -1;

    for (let i = 0; i < 9; i++) {
        if (boardState[i] === '') {
            boardState[i] = 'O';
            let score = minimax(boardState, 0, false);
            boardState[i] = '';
            if (score > bestScore) {
                bestScore = score;
                move = i;
            }
        }
    }
    return move;
}

function minimax(state, depth, isMaximizing) {
    const result = checkWinner(state);
    if (result) {
        if (result.winner === 'O') return 10 - depth;
        if (result.winner === 'X') return depth - 10;
        if (result.winner === 'draw') return 0;
    }

    if (isMaximizing) {
        let bestScore = -Infinity;
        for (let i = 0; i < 9; i++) {
            if (state[i] === '') {
                state[i] = 'O';
                let score = minimax(state, depth + 1, false);
                state[i] = '';
                bestScore = Math.max(score, bestScore);
            }
        }
        return bestScore;
    } else {
        let bestScore = Infinity;
        for (let i = 0; i < 9; i++) {
            if (state[i] === '') {
                state[i] = 'X';
                let score = minimax(state, depth + 1, true);
                state[i] = '';
                bestScore = Math.min(score, bestScore);
            }
        }
        return bestScore;
    }
}

// --- Game Mode Adjustments ---
function changeGameMode(mode) {
    gameMode = mode;
    saveScores();
    updateScoreboardDisplay();

    if (mode === 'ai') {
        modePvPBtn.classList.remove('active');
        modeAiBtn.classList.add('active');
        aiDifficultyContainer.classList.remove('hidden');
        playerOLabel.innerHTML = `<i class="fas fa-robot"></i> CPU (O)`;
    } else {
        modePvPBtn.classList.add('active');
        modeAiBtn.classList.remove('active');
        aiDifficultyContainer.classList.add('hidden');
        playerOLabel.innerHTML = `<i class="far fa-circle"></i> Player O`;
    }
    
    resetRound();
}

function changeDifficulty(diff, btn) {
    aiDifficulty = diff;
    difficultyBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    resetRound();
}

// --- Board Reset / Play Again Controls ---
function resetRound() {
    boardState = Array(9).fill('');
    currentPlayer = 'X';
    isGameActive = true;
    clearWinningLine();

    cells.forEach(cell => {
        cell.innerHTML = '';
        cell.disabled = false;
        cell.classList.remove('preview-x', 'preview-o');
    });

    updateTurnDisplay();
    gameOverOverlay.classList.add('hidden');
}

function resetScores() {
    playSound('click');
    scores[gameMode] = { x: 0, o: 0, ties: 0 };
    saveScores();
    updateScoreboardDisplay();
}

// --- Event Listeners Bindings ---
cells.forEach(cell => cell.addEventListener('click', handleCellClick));

modePvPBtn.addEventListener('click', () => {
    playSound('click');
    changeGameMode('pvp');
});

modeAiBtn.addEventListener('click', () => {
    playSound('click');
    changeGameMode('ai');
});

difficultyBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        playSound('click');
        changeDifficulty(e.target.dataset.difficulty, e.target);
    });
});

resetBoardBtn.addEventListener('click', () => {
    playSound('click');
    resetRound();
});

resetScoresBtn.addEventListener('click', resetScores);
playAgainBtn.addEventListener('click', () => {
    playSound('click');
    resetRound();
});

// Sound Toggle
soundToggleBtn.addEventListener('click', () => {
    isMuted = !isMuted;
    if (isMuted) {
        soundToggleBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
        soundToggleBtn.style.color = 'var(--text-muted)';
    } else {
        soundToggleBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
        soundToggleBtn.style.color = 'var(--text-secondary)';
        playSound('click');
    }
});

// --- Initialize App ---
loadScores();
updateTurnDisplay();
