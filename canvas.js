let canvas = document.querySelector('canvas');
let ctx = canvas.getContext('2d');
canvas.width = window.innerWidth; // update for responsivnes
canvas.height = window.innerHeight; // update for responsivnes


function Board() { // the board of the game has the board's state and other info.
    this.boardColumns = 7; // CAN'T WORK!!!!!@@@
    this.boardRows = 6; // CAN'T WORK!!!!!@@@
    this.state = createEmptyBoard(this.boardColumns);
    this.lastMoveCol;
    this.movesNumber = 0;
    this.playerColors = ['red', '#FD0'];
    this.color = 'blue';
    this.fourRowColor = 'white';
    this.isWinner = false;
    this.isTie = false;
    this.currentPlayer = this.playerColors[0];
    this.slotDim = Math.floor(Math.min(canvas.width / this.boardColumns, canvas.height / this.boardRows));


    function createEmptyBoard(boardColumns) { // Create 7col x 6row board. ( array[col][row] ). Return board.
        let board = new Array(boardColumns);
        for (let i=0 ; i < board.length ; i++) {
            board[i] = [];
        }
        return board;
    }

    this.switchCurrentPlayer = function() {
        if(this.currentPlayer === this.playerColors[0]) {
            this.currentPlayer = this.playerColors[1];
        } else this.currentPlayer = this.playerColors[0];
        return this.currentPlayer;
    }

    this.draw = function() {
        let row = 0;
        let col = 0;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for(let i = this.boardRows-1 ; i >= 0 ; i--) {
            for(let j=0 ; j<this.boardColumns ; j++) {
                this.drawSlot(col, row, this.color);
                if(i <= this.state[j].length-1) {
                    if(this.state[j][i].marked) {
                        this.drawSlot(col, row, this.fourRowColor);
                    }
                    this.state[j][i].draw();
                }
                row++;
            }
            row=0;
            col++;
        }
        if (this.isWinner) {
            this.declareWinner();
        } else if (this.isTie) {
            this.declareTie();
        }
    }

    this.drawSlot = function(col, row, color) {
        let d = this.slotDim;
        let x = row*d;
        let y = col*d;

        ctx.fillStyle = color;
        ctx.fillRect(x, y, d, d);
    
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.arc(x+d/2, y+d/2, d/3, 0, Math.PI*2, true);
        ctx.closePath();
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
    }

    this.placePiece = function(color, column) { // Place one piece in the selected column bottom. If ilegal move return false otherwise return true.
        if(!this.isLegalMove(column)) {
            return false;
        }
        let i = column-1;
        let x = (i * this.slotDim) + this.slotDim/2;
        let y = ((this.boardRows-this.state[i].length-1) * this.slotDim) + this.slotDim/2;
        this.state[i].push(new Disc(x, y, this.slotDim, color));
        this.lastMoveCol = column;
        this.movesNumber++;
        return true;
    }

    this.isLegalMove = function(column) {
        if(column > 0 && this.state[column-1].length < this.boardRows) {
            return true;
        } else return false;
    }

    this.getColByAxis = function(x, y) {
        let col = Math.floor(x / this.slotDim) + 1;
        let row = Math.floor(y / this.slotDim) + 1;
        if(col > this.boardColumns || row > this.boardRows) {
            return 0;
        } else return col;
    }

    this.isGameTie = function() {
        if(this.movesNumber >= this.boardColumns*this.boardRows) {
            this.isTie=true;
            return true;
        } else return false;
    }

    this.isGameWinner = function() {
        i = this.lastMoveCol-1;
        j = this.state[this.lastMoveCol-1].length-1;
        if(this.checkSlant(i, j) ||
           this.checkReverseSlant(i, j) ||
           this.checkVertical(i, j) ||
           this.checkHorizontal(i, j)) {
            this.isWinner = true;
            return true;
        } else return false;
    }

    this.checkSlant = function(i, j) {
        while(i-1>=0 && j+1<this.state[i-1].length && this.state[i-1][j+1].color===this.currentPlayer) {
            i--;
            j++;
        } 
        if(i <= 3 && j >= 3  && this.state[i][j].color === this.currentPlayer &&
                            j-1 < this.state[i+1].length && this.state[i+1][j-1].color === this.currentPlayer &&
                            j-2 < this.state[i+2].length && this.state[i+2][j-2].color === this.currentPlayer &&
                            j-3 < this.state[i+3].length && this.state[i+3][j-3].color === this.currentPlayer) {
            this.state[i][j].marked = true;
            this.state[i+1][j-1].marked = true;
            this.state[i+2][j-2].marked = true;
            this.state[i+3][j-3].marked = true;
            return true;
        } else return false;
    }
    
    this.checkReverseSlant = function(i, j) {
        while(i+1<this.state.length && j+1<this.state[i+1].length && this.state[i+1][j+1].color===this.currentPlayer) {
            i++;
            j++;
        }
        if(i >= 3 && j >= 3  && this.state[i][j].color === this.currentPlayer &&
                            j-1 < this.state[i-1].length && this.state[i-1][j-1].color === this.currentPlayer &&
                            j-2 < this.state[i-2].length && this.state[i-2][j-2].color === this.currentPlayer &&
                            j-3 < this.state[i-3].length && this.state[i-3][j-3].color === this.currentPlayer) {
            this.state[i][j].marked = true;
            this.state[i-1][j-1].marked = true;
            this.state[i-2][j-2].marked = true;
            this.state[i-3][j-3].marked = true;
            return true;
        } else return false;
    }

    this.checkVertical = function(i, j) {
        if(j >= 3  && this.state[i][j].color === this.currentPlayer &&
                        this.state[i][j-1].color === this.currentPlayer &&
                        this.state[i][j-2].color === this.currentPlayer &&
                        this.state[i][j-3].color === this.currentPlayer) {
            this.state[i][j].marked = true;
            this.state[i][j-1].marked = true;
            this.state[i][j-2].marked = true;
            this.state[i][j-3].marked = true;
            return true;
        } else return false;
    }

    this.checkHorizontal = function(i, j) {
        while(i-1>=0 && j<this.state[i-1].length && this.state[i-1][j].color===this.currentPlayer) {
            i--;
        }
        if(i <= 3 && this.state[i][j].color === this.currentPlayer &&
                    j < this.state[i+1].length && this.state[i+1][j].color === this.currentPlayer &&
                    j < this.state[i+2].length && this.state[i+2][j].color === this.currentPlayer &&
                    j < this.state[i+3].length && this.state[i+3][j].color === this.currentPlayer) {
            this.state[i][j].marked = true;
            this.state[i+1][j].marked = true;
            this.state[i+2][j].marked = true;
            this.state[i+3][j].marked = true;
            return true;
        } else return false;
    }

    this.declareWinner = function() {
        ctx.font = '900 ' + canvas.height/3 + 'px Arial';
        ctx.fillStyle = this.currentPlayer;
        ctx.fillText(this.currentPlayer, 10, canvas.height/3);

        ctx.fillStyle = 'pink';
        ctx.fillText('won!', 10, canvas.height-50);
    }

    this.declareTie = function() {
        ctx.font = '900 ' + canvas.height/3.6 + 'px Arial';
        ctx.fillStyle = 'rosyBrown';
        ctx.fillText('It\'s a tie!', 10, canvas.height/1.7);
    }
}


function Disc(x, y, dimension, color) {
    this.x = x;
    this.y = y;
    this.radius = dimension/2;
    this.color = color;
    this.marked = false;

    this.draw = function() {
        ctx.globalCompositeOperation = 'destination-over'
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2, false);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over'
    }
}

let click = {
    x: undefined,
    y: undefined
}

function gameClick(event) {
    click.x = event.x;
    click.y = event.y;
    let col = board.getColByAxis(click.x, click.y);
    if(board.placePiece(board.currentPlayer, col)) {
        if(board.isGameWinner() || board.isGameTie()) {
            canvas.removeEventListener('click', gameClick);
            canvas.addEventListener('click', play);
        }
        board.draw();
        board.switchCurrentPlayer();
    }
}

function play() {
    canvas.removeEventListener('click', play)
    board = new Board();
    board.draw();
    canvas.addEventListener('click', gameClick);
}

play();