var config = {
    type: Phaser.AUTO,
    width: 375,
    height: 667,
    backgroundColor: '#2d2d2d',
    parent: 'phaser-example',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 }
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

var game = new Phaser.Game(config);
var square;
// var socket = io();

function preload() {
    this.load.image('grid', '../assets/grid.png');
    this.load.image('board', '../assets/board.png');

    this.load.image('square', './assets/rook.png');
}

function create() {

    this.add.image(config.width / 2, config.height / 2, 'grid');
    this.add.image(config.width / 2, config.height / 2, 'board');

    var scaleFactor = 41 / 150;
    square = this.add.sprite(334, 187, 'square').setScale(scaleFactor).setInteractive();


    this.input.setDraggable(square);
    const gridSize = 41;

    // Correct initial grid positions based on initial rook placement
    var initialX = 334;  // Initial X of the rook
    var initialY = 187;  // Initial Y of the rook

    // this.socket = io();

    this.input.on('drag', function (pointer, gameObject, dragX, dragY) {

        // Snapping X and Y to the nearest grid line
        var newGridX = Math.floor((dragX - initialX) / gridSize) * gridSize + initialX;
        var newGridY = Math.floor((dragY - initialY) / gridSize) * gridSize + initialY;

        // Constrain the drag to left and down only (as per your game rules)
        if (newGridX <= gameObject.x && newGridY >= gameObject.y) {
            gameObject.x = newGridX;
            gameObject.y = newGridY;


            // socket.emit('move', { x: gameObject.x, y: gameObject.y });
        }

    });

    // socket.on('move', function (position) {
    //     square.x = position.x;
    //     square.y = position.y;
    // });
}


function update() {
}
