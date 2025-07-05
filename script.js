const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const CELL_SIZE = 20; // in pixels

const gameBoard = document.getElementById('game-board');
const scoreDisplay = document.getElementById('score');
const nextBlockDisplay = document.getElementById('next-block');
const startButton = document.getElementById('start-button');
const settingsButton = document.getElementById('settings-button');
const settingsModal = document.getElementById('settings-modal');
const settingsCloseButton = document.querySelector('#settings-modal .close-button');
const saveHotkeysButton = document.getElementById('save-hotkeys');

const hotkeyInputs = {
    moveLeft: document.getElementById('moveLeftKey'),
    moveRight: document.getElementById('moveRightKey'),
    moveDown: document.getElementById('moveDownKey'),
    rotate: document.getElementById('rotateKey'),
    hardDrop: document.getElementById('hardDropKey')
};

let customHotkeys = JSON.parse(localStorage.getItem('tetrisHotkeys')) || {
    moveLeft: 'ArrowLeft',
    moveRight: 'ArrowRight',
    moveDown: 'ArrowDown',
    rotate: 'ArrowUp',
    hardDrop: 'Space'
};

let board = [];
let score = 0;
let currentBlock;
let nextBlock;
let gameInterval;
let gameSpeed = 500; // milliseconds
let bag = [];

const TETROMINOS = [
    // L
    [
        [1, BOARD_WIDTH + 1, BOARD_WIDTH * 2 + 1, 2],
        [BOARD_WIDTH, BOARD_WIDTH + 1, BOARD_WIDTH + 2, BOARD_WIDTH * 2 + 2],
        [1, BOARD_WIDTH + 1, BOARD_WIDTH * 2 + 1, BOARD_WIDTH * 2],
        [BOARD_WIDTH, BOARD_WIDTH * 2, BOARD_WIDTH * 2 + 1, BOARD_WIDTH * 2 + 2]
    ],
    // J
    [
        [1, BOARD_WIDTH + 1, BOARD_WIDTH * 2 + 1, 0],
        [BOARD_WIDTH, BOARD_WIDTH * 2, BOARD_WIDTH * 2 + 1, BOARD_WIDTH * 2 + 2],
        [1, BOARD_WIDTH + 1, BOARD_WIDTH * 2 + 1, BOARD_WIDTH * 2 + 2],
        [2, BOARD_WIDTH, BOARD_WIDTH + 1, BOARD_WIDTH + 2]
    ],
    // I
    [
        [1, BOARD_WIDTH + 1, BOARD_WIDTH * 2 + 1, BOARD_WIDTH * 3 + 1],
        [BOARD_WIDTH, BOARD_WIDTH + 1, BOARD_WIDTH + 2, BOARD_WIDTH + 3],
        [1, BOARD_WIDTH + 1, BOARD_WIDTH * 2 + 1, BOARD_WIDTH * 3 + 1],
        [BOARD_WIDTH, BOARD_WIDTH + 1, BOARD_WIDTH + 2, BOARD_WIDTH + 3]
    ],
    // O
    [
        [0, 1, BOARD_WIDTH, BOARD_WIDTH + 1],
        [0, 1, BOARD_WIDTH, BOARD_WIDTH + 1],
        [0, 1, BOARD_WIDTH, BOARD_WIDTH + 1],
        [0, 1, BOARD_WIDTH, BOARD_WIDTH + 1]
    ],
    // S
    [
        [BOARD_WIDTH + 1, BOARD_WIDTH + 2, BOARD_WIDTH * 2, BOARD_WIDTH * 2 + 1],
        [0, BOARD_WIDTH, BOARD_WIDTH + 1, BOARD_WIDTH * 2 + 1],
        [BOARD_WIDTH + 1, BOARD_WIDTH + 2, BOARD_WIDTH * 2, BOARD_WIDTH * 2 + 1],
        [0, BOARD_WIDTH, BOARD_WIDTH + 1, BOARD_WIDTH * 2 + 1]
    ],
    // T
    [
        [1, BOARD_WIDTH, BOARD_WIDTH + 1, BOARD_WIDTH + 2],
        [1, BOARD_WIDTH + 1, BOARD_WIDTH + 2, BOARD_WIDTH * 2 + 1],
        [BOARD_WIDTH, BOARD_WIDTH + 1, BOARD_WIDTH + 2, BOARD_WIDTH * 2 + 1],
        [1, BOARD_WIDTH, BOARD_WIDTH + 1, BOARD_WIDTH * 2 + 1]
    ],
    // Z
    [
        [BOARD_WIDTH, BOARD_WIDTH + 1, BOARD_WIDTH * 2 + 1, BOARD_WIDTH * 2 + 2],
        [2, BOARD_WIDTH + 1, BOARD_WIDTH * 2 + 1, BOARD_WIDTH * 2],
        [BOARD_WIDTH, BOARD_WIDTH + 1, BOARD_WIDTH * 2 + 1, BOARD_WIDTH * 2 + 2],
        [2, BOARD_WIDTH + 1, BOARD_WIDTH * 2 + 1, BOARD_WIDTH * 2]
    ]
];

const COLORS = ['orange', 'blue', 'cyan', 'yellow', 'limegreen', 'purple', 'red'];

// Bag system
function fillBag() {
    bag = Array.from({ length: TETROMINOS.length }, (_, i) => i);
    // Shuffle the bag (Fisher-Yates shuffle)
    for (let i = bag.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [bag[i], bag[j]] = [bag[j], bag[i]];
    }
}

function generateNewBlock() {
    if (bag.length === 0) {
        fillBag();
    }
    const random = bag.pop();

    currentBlock = nextBlock || {
        tetromino: TETROMINOS[random],
        color: COLORS[random],
        rotation: 0,
        position: BOARD_WIDTH * 2 + Math.floor(BOARD_WIDTH / 2) - 1,
        shape: TETROMINOS[random][0]
    };

    // Prepare next block
    if (bag.length === 0) {
        fillBag();
    }
    const nextRandom = bag.pop();
    nextBlock = {
        tetromino: TETROMINOS[nextRandom],
        color: COLORS[nextRandom],
        rotation: 0,
        position: 0, // Position doesn't matter for next block display
        shape: TETROMINOS[nextRandom][0]
    };
    drawNextBlock();

    draw();

    // Check for game over immediately after drawing the new block
    if (currentBlock.shape.some(index => board[currentBlock.position + index].classList.contains('block'))) {
        alert('게임 오버!');
        clearInterval(gameInterval);
        startButton.textContent = '다시 시작'; // Allow restarting
    }
}

function drawNextBlock() {
    nextBlockDisplay.innerHTML = '';
    const displayGridSize = 4; // 4x4 grid for next block display
    for (let i = 0; i < displayGridSize * displayGridSize; i++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        nextBlockDisplay.appendChild(cell);
    }

    nextBlock.shape.forEach(index => {
        // Adjust position for 4x4 display grid
        const row = Math.floor(index / BOARD_WIDTH);
        const col = index % BOARD_WIDTH;
        const displayIndex = row * displayGridSize + col;

        if (displayIndex < displayGridSize * displayGridSize) {
            nextBlockDisplay.children[displayIndex].classList.add('block', nextBlock.color);
        }
    });
}

function createBoard() {
    for (let i = 0; i < BOARD_WIDTH * BOARD_HEIGHT; i++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        gameBoard.appendChild(cell);
        board.push(cell);
    }
}

function draw() {
    currentBlock.shape.forEach(index => {
        board[currentBlock.position + index].classList.add('block', currentBlock.color);
    });
}

function undraw() {
    currentBlock.shape.forEach(index => {
        board[currentBlock.position + index].classList.remove('block', currentBlock.color);
    });
}

function moveDown() {
    undraw();
    currentBlock.position += BOARD_WIDTH;
    draw();
    freeze();
}

function freeze() {
    // Check if the block has landed
    if (currentBlock.shape.some(index =>
        (currentBlock.position + index + BOARD_WIDTH >= BOARD_WIDTH * BOARD_HEIGHT) || // Hit bottom
        (board[currentBlock.position + index + BOARD_WIDTH] && board[currentBlock.position + index + BOARD_WIDTH].classList.contains('block')) // Hit another block
    )) {
        // Add the current block to the fixed board
        currentBlock.shape.forEach(index => board[currentBlock.position + index].classList.add('block', currentBlock.color));

        checkRows(); // Check for completed rows

        // Generate the next block
        generateNewBlock();

        // Check for game over: if the new block spawns into an occupied space
        if (currentBlock.shape.some(index => board[currentBlock.position + index].classList.contains('block'))) {
            alert('게임 오버!');
            clearInterval(gameInterval);
            startButton.textContent = '다시 시작'; // Allow restarting
            return;
        }
    }
}

function moveLeft() {
    undraw();
    const isAtLeftEdge = currentBlock.shape.some(index => (currentBlock.position + index) % BOARD_WIDTH === 0);
    if (!isAtLeftEdge) currentBlock.position -= 1;
    if (currentBlock.shape.some(index => board[currentBlock.position + index].classList.contains('block'))) {
        currentBlock.position += 1;
    }
    draw();
}

function moveRight() {
    undraw();
    const isAtRightEdge = currentBlock.shape.some(index => (currentBlock.position + index) % BOARD_WIDTH === BOARD_WIDTH - 1);
    if (!isAtRightEdge) currentBlock.position += 1;
    if (currentBlock.shape.some(index => board[currentBlock.position + index].classList.contains('block'))) {
        currentBlock.position -= 1;
    }
    draw();
}

function rotate() {
    undraw();
    currentBlock.rotation = (currentBlock.rotation + 1) % currentBlock.tetromino.length;
    currentBlock.shape = currentBlock.tetromino[currentBlock.rotation];
    draw();
}

function generateNewBlock() {
    if (bag.length === 0) {
        fillBag();
    }
    const random = bag.pop();

    currentBlock = nextBlock || {
        tetromino: TETROMINOS[random],
        color: COLORS[random],
        rotation: 0,
        position: BOARD_WIDTH * 2 + Math.floor(BOARD_WIDTH / 2) - 1,
        shape: TETROMINOS[random][0]
    };

    // Prepare next block
    if (bag.length === 0) {
        fillBag();
    }
    const nextRandom = bag.pop();
    nextBlock = {
        tetromino: TETROMINOS[nextRandom],
        color: COLORS[nextRandom],
        rotation: 0,
        position: 0, // Position doesn't matter for next block display
        shape: TETROMINOS[nextRandom][0]
    };
    drawNextBlock();

    draw();

    // Check for game over immediately after drawing the new block
    if (currentBlock.shape.some(index => board[currentBlock.position + index].classList.contains('block'))) {
        alert('게임 오버!');
        clearInterval(gameInterval);
        startButton.textContent = '다시 시작'; // Allow restarting
    }
}

function checkRows() {
    for (let i = 0; i < BOARD_HEIGHT; i++) {
        const rowStartIndex = i * BOARD_WIDTH;
        const rowEndIndex = rowStartIndex + BOARD_WIDTH;
        const rowCells = board.slice(rowStartIndex, rowEndIndex);

        if (rowCells.every(cell => cell.classList.contains('block'))) {
            score += 10;
            scoreDisplay.textContent = score;

            // Remove the completed row from the board array
            for (let j = 0; j < BOARD_WIDTH; j++) {
                board[rowStartIndex + j].classList.remove('block', ...COLORS);
            }

            // Remove the row from the DOM
            for (let j = 0; j < BOARD_WIDTH; j++) {
                gameBoard.removeChild(board[rowStartIndex + j]);
            }

            // Remove from board array and add new empty cells at the top
            const newEmptyCells = Array.from({ length: BOARD_WIDTH }, () => {
                const newCell = document.createElement('div');
                newCell.classList.add('cell');
                return newCell;
            });
            board.splice(rowStartIndex, BOARD_WIDTH);
            board.unshift(...newEmptyCells);

            // Re-append all cells to the gameBoard to reflect changes
            gameBoard.innerHTML = ''; // Clear existing DOM elements
            board.forEach(cell => gameBoard.appendChild(cell)); // Append updated board
        }
    }
}

function startGame() {
    board = []; // Clear the board array
    gameBoard.innerHTML = ''; // Clear the DOM board
    createBoard();
    fillBag(); // Initialize the bag
    nextBlock = null; // Clear next block for first generation
    generateNewBlock();
    gameInterval = setInterval(moveDown, gameSpeed);
}

startButton.addEventListener('click', startGame);

settingsButton.addEventListener('click', () => {
    loadHotkeysToModal();
    settingsModal.style.display = 'block';
});

settingsCloseButton.addEventListener('click', () => {
    settingsModal.style.display = 'none';
});

saveHotkeysButton.addEventListener('click', () => {
    saveHotkeysFromModal();
    settingsModal.style.display = 'none';
});

function loadHotkeysToModal() {
    for (const action in hotkeyInputs) {
        hotkeyInputs[action].value = customHotkeys[action];
    }
}

function saveHotkeysFromModal() {
    for (const action in hotkeyInputs) {
        customHotkeys[action] = hotkeyInputs[action].value;
    }
    localStorage.setItem('tetrisHotkeys', JSON.stringify(customHotkeys));
}

// Initial load of hotkeys
loadHotkeysToModal();

// Keyboard controls
document.addEventListener('keydown', e => {
    if (e.key === customHotkeys.moveLeft) {
        moveLeft();
    } else if (e.key === customHotkeys.moveRight) {
        moveRight();
    } else if (e.key === customHotkeys.moveDown) {
        moveDown();
    } else if (e.key === customHotkeys.rotate) {
        rotate();
    } else if (e.key === customHotkeys.hardDrop) {
        // Implement hard drop later
    }
});