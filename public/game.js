const config = {
  type: Phaser.AUTO,
  width: 375,
  height: 667,
  backgroundColor: "#2d2d2d",
  parent: "phaser-example",
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 0 },
    },
  },
  scene: {
    preload: preload,
    create: create,
    update: update,
  },
};

const game = new Phaser.Game(config);
let square;

let rook;
let player1Circle;
let player2Circle;
let activePlayer = 1; // Initially set to player 1
let timerEvent; // Timer event reference
let board;

function preload() {
  this.load.image("grid", "../assets/grid.png");
  this.load.image("board", "../assets/board.png");
  this.load.image("rook", "./assets/rook.png");

  this.load.image("player1", "./assets/player1.png");
  this.load.image("player2", "./assets/player2.png");
}

function create() {
  this.add.image(config.width / 2, config.height / 2, "grid");
  board = this.add.image(config.width / 2, config.height / 2, "board");

  // Add a green border around the board
  const graphics = this.add.graphics();
  graphics.lineStyle(4, 0x00ff00); // Green color, line thickness 4
  graphics.strokeRect(
    board.x - board.displayWidth / 2,
    board.y - board.displayHeight / 2,
    board.displayWidth,
    board.displayHeight
  );

  const scaleFactor = 41 / 150;
  rook = this.add
    .sprite(334, 187, "rook")
    .setScale(scaleFactor)
    .setInteractive();

  // Add player 1 circle
  player1Circle = this.add.image(config.width / 2, 50, "player1");
  player1Circle.setScale(0.5); // Adjust scale if needed

  // Add player 2 circle
  player2Circle = this.add.image(
    config.width / 2,
    config.height - 50,
    "player2"
  );
  player2Circle.setScale(0.5); // Adjust scale if needed

  // Start the timer
  timerEvent = this.time.addEvent({
    delay: 60000, // 5 seconds
    loop: true,
    callback: switchActivePlayer,
    callbackScope: this,
  });
  // Connect to Socket.io server
  socket = io();

  // Handle successful connection
  socket.on("connected", (data) => {
    console.log(data.message);
  });

  // Add event listeners for keyboard input
  this.input.keyboard.on("keydown", (event) => handleKeyDown.call(this, event));

  // Listen for rook position updates from the server
  socket.on("rookPosition", (data) => {
    // Update the rook's position on Bhanu's side
    rook.x = data.x;
    rook.y = data.y;
  });
}

function handleKeyDown(event) {
  const cursors = this.input.keyboard.createCursorKeys();
  const step = 41; // The size of each grid cell

  if (cursors.left.isDown) {
    // Move rook to the left
    moveRook(-step, 0);
  } else if (cursors.right.isDown) {
    // Move rook to the right
    moveRook(step, 0);
  } else if (cursors.up.isDown) {
    // Move rook up
    moveRook(0, -step);
  } else if (cursors.down.isDown) {
    // Move rook down
    moveRook(0, step);
  }
}

function moveRook(deltaX, deltaY) {
  // Calculate new position
  const newX = rook.x + deltaX;
  const newY = rook.y + deltaY;

  // Calculate the boundaries of the board
  const minX = board.x - board.displayWidth / 2;
  const maxX = board.x + board.displayWidth / 2;
  const minY = board.y - board.displayHeight / 2;
  const maxY = board.y + board.displayHeight / 2;

  // Check if new position is within the bounds of the board
  if (newX >= minX && newX <= maxX && newY >= minY && newY <= maxY) {
    // Update rook's position
    rook.x = newX;
    rook.y = newY;

    // Emit the new rook position to the server
    socket.emit("rookPosition", { x: newX, y: newY });
  }
}

// Function to switch active player and highlight the corresponding circle
function switchActivePlayer() {
  const maxBorderWidth = 4; // Width of the border
  const borderColor = 0x00ff00; // Green color
  const remainingTime = timerEvent.getProgress();

  // Clear previous border from both circles
  player1Circle.removeBorder();
  player2Circle.removeBorder();

  let activePlayerName;
  if (activePlayer === 1) {
    const borderWidth = maxBorderWidth * remainingTime;
    player1Circle.addBorder(borderWidth, borderColor);
    activePlayer = 2; // Switch to player 2
    activePlayerName = "Abin";
  } else {
    const borderWidth = maxBorderWidth * remainingTime;
    player2Circle.addBorder(borderWidth, borderColor);
    activePlayer = 1; // Switch to player 1
    activePlayerName = "Bhanu";
  }

  console.log(`Active player: ${activePlayerName}`);
}

// Function to add a border around the circle sprite
Phaser.GameObjects.Image.prototype.addBorder = function (angle, color) {
  const graphics = this.scene.add.graphics();
  const radius = this.displayWidth / 2 + 4; // Radius of the circle including the border width
  const startAngle = Phaser.Math.DegToRad(270); // Start angle at 12 o'clock position
  const endAngle = Phaser.Math.DegToRad(270 + angle); // End angle based on remaining time

  graphics.lineStyle(4, color);
  graphics.beginPath();
  graphics.arc(this.x, this.y, radius, startAngle, endAngle, false);
  graphics.stroke();
  this.borderGraphics = graphics;
};

// Function to remove the border from the circle sprite
Phaser.GameObjects.Image.prototype.removeBorder = function () {
  if (this.borderGraphics) {
    this.borderGraphics.destroy();
    this.borderGraphics = null;
  }
};

function update() {
  // Calculate remaining time
  const remainingTime = timerEvent.getProgress();
  const maxAngle = 360; // Full circle
  const borderColor = 0x00ff00; // Green color

  // Clear previous border from both circles
  player1Circle.removeBorder();
  player2Circle.removeBorder();

  // Calculate angle of the border based on remaining time
  const angle = maxAngle * (1 - remainingTime);

  if (activePlayer === 1) {
    player1Circle.addBorder(angle, borderColor);
  } else {
    player2Circle.addBorder(angle, borderColor);
  }
}
