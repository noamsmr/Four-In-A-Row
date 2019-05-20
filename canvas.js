let canvas = document.querySelector('canvas');
let ctx = canvas.getContext('2d');
canvas.width = window.innerWidth; // TODO: responsivnes
canvas.height = window.innerHeight; // TODO: responsivnes
const BOARD_COLS = 7;
const BOARD_ROWS = 6;
const BOARD_COLOR = 'blue';
const SEQUENCE_COLOR = 'white';
const GAME_STATUSES = {playing: 0, win: 1, tie: 2};
const PLAYERS = [
    {name: 'RED', color: 'red'},
    {name: 'YELLOW', color: '#FD0'},
];
const NEARBY_CELL_DIRECTIONS = {
    above: {x:0, y:1},
    aboveRight: {x:1, y:1},
    right: {x:1, y:0},
    belowRight: {x:1, y:-1},
    below: {x:0, y:-1},
    belowLeft: {x:-1, y:-1},
    left: {x:-1, y:0},
    aboveLeft: {x:-1, y:1},
}; // represents index steps to the cell's neighbor.
const SLOT_DIMENSION = Math.floor(Math.min(canvas.width / BOARD_COLS, canvas.height / BOARD_ROWS));

// The Game class has the info about the game and his state.
// discsState is represents the discs placements on the board.  
class Game {
    constructor() {
        this.discsState = this.createEmptyState();
        this.lastMoveCol;
        this.movesNumber = 0;
        this.gameStatus = GAME_STATUSES.playing;
        this.currentPlayer = PLAYERS[0];
    }
    
    // Return's new disc state.
    createEmptyState() {
        let discsState = new Array(BOARD_COLS);
        for (let col=0 ; col < discsState.length ; col++) {
            discsState[col] = [];
        }
        return discsState;
    }

    // Switch player and return him.
    switchCurrentPlayer() {
        this.currentPlayer = (this.currentPlayer === PLAYERS[0] ? PLAYERS[1] : PLAYERS[0]);
        return this.currentPlayer;
    }

    // Drawing the board with all of it's parts: slots, discs and game ending.
    draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for(let row = BOARD_ROWS-1 ; row >= 0 ; row--) {
            for(let col=0 ; col<BOARD_COLS ; col++) {
                this.drawSlot(col, row, BOARD_COLOR);
                if(row < this.discsState[col].length) {
                    if(this.discsState[col][row].marked) {
                        this.drawSlot(col, row, SEQUENCE_COLOR);
                    }
                    this.discsState[col][row].draw();
                }
            }
        }
        if (this.gameStatus === GAME_STATUSES.win) {
            this.declareWinner();
        } else if (this.gameStatus === GAME_STATUSES.tie) {
            this.declareTie();
        }
    }

    // Draw the text for the winner.
    declareWinner() {
        ctx.font = '900 ' + canvas.height/5 + 'px Arial';
        ctx.fillStyle = this.currentPlayer.color;
        ctx.fillText(this.currentPlayer.name, 10, canvas.height/3);

        ctx.fillStyle = 'pink';
        ctx.fillText('won!', 10, canvas.height-50);
    }

    // Draw the text for tie.
    declareTie() {
        ctx.font = '900 ' + canvas.height/3.6 + 'px Arial';
        ctx.fillStyle = 'rosyBrown';
        ctx.fillText('It\'s a tie!', 10, canvas.height/1.7);
    }

    // Determine if there is disc at cell. Return boolean.
    isDiscInSlot(col, row) {
        return (col >= 0 && col <BOARD_COLS && row >=0 &&row < this.discsState[col].length);
    }

    // Draw one slot (cell).
    drawSlot(col, row, color) {
        let axis = colRowToAxis(col, row);

        ctx.fillStyle = color;
        ctx.fillRect(axis.x, axis.y, SLOT_DIMENSION, SLOT_DIMENSION);
    
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.arc(axis.x+SLOT_DIMENSION/2, axis.y+SLOT_DIMENSION/2, SLOT_DIMENSION/3, 0, Math.PI*2, true);
        ctx.closePath();
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
    }

    // Place disc on top of column. If illegal return false, otherwise: true.
    placeDisc(color, col) {
        if(!this.isLegalMove(col)) {
            return false;
        }
        let row = this.rowOfColTopDisc(col);
        this.discsState[col].push(new Disc(col, row, color));
        this.lastMoveCol = col;
        this.movesNumber++;
        return true;
    }

    // Return the row of column top disc.
    rowOfColTopDisc(col) {
        return this.discsState[col].length-1;
    }

    // If move to this column is legal return true, otherwise: false.
    isLegalMove(col) {
        return (this.isWithinBoard(col) && this.discsState[col].length < BOARD_ROWS ? true : false);
    }

    // If column is inside the board return true. otherwise false.
    isWithinBoard(col) {
        return ((col >= 0 && col < BOARD_COLS && this.discsState[col].length >=0 && this.discsState[col].length <= BOARD_ROWS) ? true : false);
    }

    // Determine if tie.
    isTie() {
        if(this.movesNumber >= BOARD_COLS*BOARD_ROWS) {
            this.gameStatus = GAME_STATUSES.tie;
            return true;
        } else return false;
    }

    // Determine if current player won.
    isCurrentPlayerWin() {
        let col = this.lastMoveCol;
        let row = this.discsState[this.lastMoveCol].length-1;
        if(this.isAnySequenceOfFour(col, row)) {
            this.gameStatus = GAME_STATUSES.win;
            return true;
        } else return false;
    }

    // Watch the last placed disc, and find if it's in a sequence of four or higher.
    isAnySequenceOfFour(col, row) {
        let directions = [
            NEARBY_CELL_DIRECTIONS.belowRight,
            NEARBY_CELL_DIRECTIONS.belowLeft,
            NEARBY_CELL_DIRECTIONS.below,
            NEARBY_CELL_DIRECTIONS.right, ]
        for(let index = 0 ; index < directions.length ; index++) {
            let axis = this.getSequenceStart(col, row, directions[index]);
            col = axis.col;
            row = axis.row;
            if(this.isSequenceFromStart(col, row, directions[index])) {
                this.markSequence(col, row, directions[index]);
                return true;
            }
        }
        return false;
    }

    // Receiving first cell of sequence and direction.
    // Determine if there's a row in that direction.
    // For direction varible use 'NEARBY_CELL_DIRECTION.direction' const.
    isSequenceFromStart(col, row, direction) {
        let counter = 1;
        while(this.isCellEqualNearbyCell(col, row, direction)) {
            col+=direction.x;
            row+=direction.y;
            counter++;
        }
        return (counter >= 4 ? true : false);
    }

    // Marking discs that are in the sequence.
    // For direction varible use 'NEARBY_CELL_DIRECTION.direction' const.
    markSequence(col, row, direction) {
        while(this.isCellEqualNearbyCell(col, row, direction)) {
            this.discsState[col][row].marked = true;
            col+=direction.x;
            row+=direction.y;
        }
        this.discsState[col][row].marked = true;
    }

    // Determine if nearby cell color in the direction is equal to current player color.
    // For direction varible use 'NEARBY_CELL_DIRECTION.direction' const.
    isCellEqualNearbyCell(col, row, direction) {
        if(this.isWithinBoard(col + direction.x) &&
            this.isDiscInSlot(col + direction.x, row + direction.y) && 
            this.discsState[col + direction.x][row + direction.y].color === this.currentPlayer.color) {
            return true;
        } else return false;
    }

    // Find the starting cell. (Searching in opposite direction)
    // For direction varible use 'NEARBY_CELL_DIRECTION.direction' const.
    getSequenceStart(col, row, direction) {
        direction = this.reverseDirection(direction);
        while(this.isCellEqualNearbyCell(col, row, direction)) {
            col+=direction.x;
            row+=direction.y;
        }
        return {col, row};
    }

    // Reverse the direction.
    // For direction varible use 'NEARBY_CELL_DIRECTION.direction' const.
    reverseDirection(direction) {
        return {x: direction.x * -1, y: direction.y * -1};
    }

}


// It's Disc class.
class Disc {
    constructor(col, row, color) {
        this.axis = colRowToAxis(col, row);
        this.axis.x += SLOT_DIMENSION/2;
        this.axis.y -= SLOT_DIMENSION/2;
        this.radius = SLOT_DIMENSION/2;
        this.color = color;
        this.marked = false;
    }

    // Drawing one disc by it's properties.
    draw() {
        ctx.globalCompositeOperation = 'destination-over'
        ctx.beginPath();
        ctx.arc(this.axis.x, this.axis.y, this.radius, 0, Math.PI*2, false);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over'
    }
}

// Convert's column and row to x y axis.
let colRowToAxis = function(col, row) {
    let x = Math.floor(col * SLOT_DIMENSION);
    let y = Math.floor((BOARD_ROWS-row-1) * SLOT_DIMENSION);
    return {x, y};
}

// Convert's x y axis to column and row.
let axisToColRow = function(x, y) {
    let col = Math.floor(x / SLOT_DIMENSION);
    let row = Math.floor(y / SLOT_DIMENSION);
    return {col, row};
}

let click = {
    x: undefined,
    y: undefined
}

// When clicking in the game.
let gameClick = function(event) {
    click.x = event.x;
    click.y = event.y;
    let col = axisToColRow(click.x, click.y).col;
    if(game.placeDisc(game.currentPlayer.color, col)) {
        if(game.isCurrentPlayerWin() || game.isTie()) {
            canvas.removeEventListener('click', gameClick);
            canvas.addEventListener('click', play);
        }
        game.draw();
        game.switchCurrentPlayer();
    }
}

// Starting the game.
let play = function() {
    canvas.removeEventListener('click', play)
    game = new Game();
    game.draw();
    canvas.addEventListener('click', gameClick);
}



play();