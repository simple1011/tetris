const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const CELL_SIZE = 20; // in pixels

const gameBoard = document.getElementById('game-board');
const scoreDisplay = document.getElementById('score');
const nextBlockDisplay = document.getElementById('next-block');
const startButton = document.getElementById('start-button');

let board = [];
let score = 0;
let currentBlock;
let nextBlock;
let gameInterval;
let gameSpeed = 500; // milliseconds

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
    if (currentBlock.shape.some(index => board[currentBlock.position + index + BOARD_WIDTH].classList.contains('block'))) {
        currentBlock.shape.forEach(index => board[currentBlock.position + index].classList.add('block'));
        generateNewBlock();
        checkRows();
        gameOver();
        return;
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
    const random = Math.floor(Math.random() * TETROMINOS.length);
    currentBlock = {
        tetromino: TETROMINOS[random],
        color: COLORS[random],
        rotation: 0,
        position: BOARD_WIDTH * 2 + Math.floor(BOARD_WIDTH / 2) - 1,
        shape: TETROMINOS[random][0]
    };
    draw();
}

function checkRows() {
    for (let i = 0; i < BOARD_HEIGHT; i++) {
        const row = [];
        for (let j = 0; j < BOARD_WIDTH; j++) {
            row.push(board[i * BOARD_WIDTH + j]);
        }

        if (row.every(cell => cell.classList.contains('block'))) {
            score += 10;
            scoreDisplay.textContent = score;
            row.forEach(cell => {
                cell.classList.remove('block', ...COLORS);
            });
            const removedCells = board.splice(i * BOARD_WIDTH, BOARD_WIDTH);
            board = removedCells.concat(board);
            board.forEach(cell => gameBoard.appendChild(cell));
        }
    }
}

function gameOver() {
    if (currentBlock.shape.some(index => board[currentBlock.position + index].classList.contains('block'))) {
        alert('게임 오버!');
        clearInterval(gameInterval);
    }
}

function startGame() {
    createBoard();
    generateNewBlock();
    gameInterval = setInterval(moveDown, gameSpeed);
}

startButton.addEventListener('click', startGame);