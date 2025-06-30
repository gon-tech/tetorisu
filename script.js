const canvas = document.getElementById('tetris-board');
const context = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const nextCanvas = document.getElementById('next-piece');
const nextContext = nextCanvas.getContext('2d');

const ROW = 20;
const COL = 10;
const SQ = 30; // size of a square
const VACANT = '#000'; // color of an empty square

// draw a square
function drawSquare(x, y, color) {
    context.fillStyle = color;
    context.fillRect(x * SQ, y * SQ, SQ, SQ);

    context.strokeStyle = '#2c3e50';
    context.strokeRect(x * SQ, y * SQ, SQ, SQ);
}

// create the board
let board = [];
for (let r = 0; r < ROW; r++) {
    board[r] = [];
    for (let c = 0; c < COL; c++) {
        board[r][c] = VACANT;
    }
}

// draw the board
function drawBoard() {
    for (let r = 0; r < ROW; r++) {
        for (let c = 0; c < COL; c++) {
            drawSquare(c, r, board[r][c]);
        }
    }
}

drawBoard();

// The pieces and their colors
const PIECES = [
    [Z, "#f83d3d"],
    [S, "#68f07f"],
    [T, "#f8f53d"],
    [O, "#3d8df8"],
    [L, "#c53df8"],
    [I, "#3df8f5"],
    [J, "#f8a53d"]
];

// Generate random pieces
function randomPiece() {
    let r = Math.floor(Math.random() * PIECES.length);
    return new Piece(PIECES[r][0], PIECES[r][1]);
}

let p = randomPiece();
let nextP = randomPiece();

// The Object Piece
function Piece(tetromino, color) {
    this.tetromino = tetromino;
    this.color = color;

    this.tetrominoN = 0; // we start from the first pattern
    this.activeTetromino = this.tetromino[this.tetrominoN];

    // we need to control the pieces
    this.x = 3;
    this.y = -2;
}

// fill function
Piece.prototype.fill = function(color) {
    for (let r = 0; r < this.activeTetromino.length; r++) {
        for (let c = 0; c < this.activeTetromino.length; c++) {
            // we draw only occupied squares
            if (this.activeTetromino[r][c]) {
                drawSquare(this.x + c, this.y + r, color);
            }
        }
    }
}

// draw a piece to the board
Piece.prototype.draw = function() {
    this.fill(this.color);
}

// undraw a piece
Piece.prototype.unDraw = function() {
    this.fill(VACANT);
}

// move down the piece
Piece.prototype.moveDown = function() {
    if (!this.collision(0, 1, this.activeTetromino)) {
        this.unDraw();
        this.y++;
        this.draw();
    } else {
        this.lock();
        if(gameOver) return;
        p = nextP;
        nextP = randomPiece();
        drawNext();
    }
}

// move Right the piece
Piece.prototype.moveRight = function() {
    if (!this.collision(1, 0, this.activeTetromino)) {
        this.unDraw();
        this.x++;
        this.draw();
    }
}

// move Left the piece
Piece.prototype.moveLeft = function() {
    if (!this.collision(-1, 0, this.activeTetromino)) {
        this.unDraw();
        this.x--;
        this.draw();
    }
}

// rotate the piece
Piece.prototype.rotate = function() {
    let nextPattern = this.tetromino[(this.tetrominoN + 1) % this.tetromino.length];
    let kick = 0;

    if (this.collision(0, 0, nextPattern)) {
        if (this.x > COL / 2) {
            // it's the right wall
            kick = -1; // we need to move the piece to the left
        } else {
            // it's the left wall
            kick = 1; // we need to move the piece to the right
        }
    }

    if (!this.collision(kick, 0, nextPattern)) {
        this.unDraw();
        this.x += kick;
        this.tetrominoN = (this.tetrominoN + 1) % this.tetromino.length;
        this.activeTetromino = this.tetromino[this.tetrominoN];
        this.draw();
    }
}

let score = 0;

Piece.prototype.lock = function() {
    for (let r = 0; r < this.activeTetromino.length; r++) {
        for (let c = 0; c < this.activeTetromino.length; c++) {
            if (!this.activeTetromino[r][c]) {
                continue;
            }
            if (this.y + r < 0) {
                gameOver = true;
                break;
            }
            board[this.y + r][this.x + c] = this.color;
        }
        if(gameOver) break;
    }

    if(gameOver){
        showGameOverScreen();
        return;
    }

    // remove full rows
    for (let r = 0; r < ROW; r++) {
        let isRowFull = true;
        for (let c = 0; c < COL; c++) {
            isRowFull = isRowFull && (board[r][c] != VACANT);
        }
        if (isRowFull) {
            for (let y = r; y > 1; y--) {
                for (let c = 0; c < COL; c++) {
                    board[y][c] = board[y - 1][c];
                }
            }
            for (let c = 0; c < COL; c++) {
                board[0][c] = VACANT;
            }
            score += 10;
        }
    }
    drawBoard();
    scoreElement.innerHTML = score;
}

// collision function
Piece.prototype.collision = function(x, y, piece) {
    for (let r = 0; r < piece.length; r++) {
        for (let c = 0; c < piece.length; c++) {
            if (!piece[r][c]) {
                continue;
            }
            let newX = this.x + c + x;
            let newY = this.y + r + y;

            if (newX < 0 || newX >= COL || newY >= ROW) {
                return true;
            }
            if (newY < 0) {
                continue;
            }
            if (board[newY][newX] != VACANT) {
                return true;
            }
        }
    }
    return false;
}

// CONTROL the piece
document.addEventListener("keydown", CONTROL);

function CONTROL(event) {
    if(gameOver) return;
    if (event.keyCode == 37) {
        p.moveLeft();
    } else if (event.keyCode == 38) {
        p.rotate();
    } else if (event.keyCode == 39) {
        p.moveRight();
    } else if (event.keyCode == 40) {
        p.moveDown();
    }
}

// drop the piece every 1sec
let dropStart = Date.now();
let gameOver = false;

function drop() {
    let now = Date.now();
    let delta = now - dropStart;
    if (delta > 1000) {
        p.moveDown();
        dropStart = Date.now();
    }
    if (!gameOver) {
        requestAnimationFrame(drop);
    }
}

function drawNext() {
    const nextSQ = 20;
    nextContext.fillStyle = '#000';
    nextContext.fillRect(0, 0, nextCanvas.width, nextCanvas.height);

    const tetromino = nextP.tetromino[0];
    const color = nextP.color;
    const w = tetromino.length * nextSQ;
    const h = tetromino.length * nextSQ;
    const offsetX = (nextCanvas.width - w) / 2;
    const offsetY = (nextCanvas.height - h) / 2;

    for (let r = 0; r < tetromino.length; r++) {
        for (let c = 0; c < tetromino.length; c++) {
            if (tetromino[r][c]) {
                nextContext.fillStyle = color;
                nextContext.fillRect(offsetX + c * nextSQ, offsetY + r * nextSQ, nextSQ, nextSQ);
                nextContext.strokeStyle = '#2c3e50';
                nextContext.strokeRect(offsetX + c * nextSQ, offsetY + r * nextSQ, nextSQ, nextSQ);
            }
        }
    }
}

function showGameOverScreen(){
    context.fillStyle = 'rgba(0,0,0, 0.75)';
    context.fillRect(0,0,canvas.width, canvas.height);
    context.fillStyle = '#ff69b4';
    context.font = '45px "Segoe UI"';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText("Game Over", canvas.width/2, canvas.height/2 - 40);
    context.fillStyle = '#e0e0e0';
    context.font = '20px "Segoe UI"';
    context.fillText("Press F5 to restart", canvas.width/2, canvas.height/2 + 20);
}

drawNext();
drop();
