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
const ACTIVE_TIME_FOR_A_PLAYER = 5000;
let TURN_DURATION = 5000; // 60 seconds

let rook;
let player1Circle;
let player2Circle;
let activePlayer = 1; // Initially set to player 1
let timerEvent; // Timer event reference
let timerText;
let board;
let playerName;
let currentActivePlayerName;
let remainingTime;
let rookStartPosition = null; // This will hold the {x, y} of the rook at the start of the turn

function preload() {
  this.load.image("grid", "../assets/grid.png");
  this.load.image("board", "../assets/board.png");
  this.load.image("rook", "./assets/rook.png");

  this.load.image("player1", "./assets/player1.png");
  this.load.image("player2", "./assets/player2.png");
  this.load.image("destination", "./assets/destination.png");
  this.load.image("winner-board", "./assets/winner-board.png");
}

function create() {
  this.add.image(config.width / 2, config.height / 2, "grid");
  board = this.add.image(config.width / 2, config.height / 2, "board");

  // Add a green border around the board
  const graphics = this.add.graphics();
  graphics.lineStyle(2, 0xffd700); // Green color, line thickness 4
  graphics.strokeRect(
    board.x - board.displayWidth / 2,
    board.y - board.displayHeight / 2,
    board.displayWidth,
    board.displayHeight
  );

  const scaleFactor = 30 / 150;
  rook = this.add
    .sprite(334, 187, "rook")
    .setScale(scaleFactor)
    .setInteractive();

  destination = this.add
    .sprite(43, 480, "destination")
    .setScale(50 / 150)
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

  socket = io();

  // Handle successful connection
  socket.on("connected", (data) => {
    console.log(data.message);
    playerName = data.playerName; // Capture the assigned player name
  });

  // Add event listeners for keyboard input
  this.input.keyboard.on("keydown", (event) => handleKeyDown.call(this, event));

  // Listen for rook position updates from the server
  socket.on("rookPosition", (data) => {
    // Update the rook's position on Bhanu's side
    rook.x = data.x;
    rook.y = data.y;
  });

  socket.on("gameEnd", (data) => {
    // Display win/lose message on client side
    displayEndGameMessage(playerName === currentActivePlayerName); // true if this client is the winner
  });

  // Listen for timer updates from the server
  socket.on("timerUpdate", (data) => {
    if (remainingTime == 0) {
      rookStartPosition = null;
    }
    // Update the remaining time on both clients
    remainingTime = data.remainingTime;
    activePlayer = data.activePlayer;
    currentActivePlayerName = data.playerName;
  });
}

function handleKeyDown(event) {
  const cursors = this.input.keyboard.createCursorKeys();
  const step = 41; // The size of each grid cell

  // Check if the current player is active
  if (playerName === currentActivePlayerName) {
    if (cursors.left.isDown) {
      // Move rook to the left
      moveRook(-step, 0);
    } else if (cursors.right.isDown) {
      // Move rook to the right within the same row
      moveRook(step, 0);
    } else if (cursors.up.isDown) {
      // Move rook up within the same column
      moveRook(0, -step);
    } else if (cursors.down.isDown) {
      // Move rook down
      moveRook(0, step);
    }
  }
}

function moveRook(deltaX, deltaY) {
  // Ensure the starting position is recorded at the beginning of the turn
  if (!rookStartPosition) {
    rookStartPosition = { x: rook.x, y: rook.y }; // Initialize at the start of a turn
  }

  // Calculate new position
  const newX = rook.x + deltaX;
  const newY = rook.y + deltaY;

  // Calculate the boundaries of the board
  const minX = board.x - board.displayWidth / 2;
  const maxX = board.x + board.displayWidth / 2;
  const minY = board.y - board.displayHeight / 2;
  const maxY = board.y + board.displayHeight / 2;

  // Check if new position is within the bounds of the board
  if (
    newX >= minX &&
    newX <= maxX &&
    newY >= minY &&
    newY <= maxY &&
    newX <= rookStartPosition.x &&
    newY >= rookStartPosition.y
  ) {
    // Restrict leftward movement on the row from starting position
    if (
      deltaY === 0 &&
      newX <= rookStartPosition.x &&
      newY === rookStartPosition.y
    ) {
      rook.x = newX;
    }
    // Restrict downward movement on the column from starting position
    if (
      deltaX === 0 &&
      newY >= rookStartPosition.y &&
      newX === rookStartPosition.x
    ) {
      rook.y = newY;
    }

    console.log(newX, newY);
    if (newX === 47 && newY === 474) {
      // Add winner logic here
      handleWin();
    }

    // Emit the new rook position to the server
    socket.emit("rookPosition", { x: rook.x, y: rook.y });
  }
}

function handleWin() {
  console.log("handle win called");

  // Emit win/lose event to all players
  socket.emit("gameEnd", { winner: playerName });
}

function displayEndGameMessage(isWinner) {
  rook.setScale = 100 / 150;
  rook.depth = destination.depth + 1;

  const message = isWinner ? "You win" : "You lose";
  // Code to display the message on the game canvas or HTML
  const messageElement = document.getElementById("gameMessage");
  messageElement.textContent = message;
  messageElement.style.display = "block";

  // Clear previous border from both circles
  remainingTime = 0;
  player1Circle.removeBorder();
  player2Circle.removeBorder();
  player1Circle.visible = false;
  player2Circle.visible = false;
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
  if (remainingTime != undefined) {
    const maxAngle = 360; // Full circle
    const borderColor = 0x00ff00; // Green color

    // Clear previous border from both circles
    player1Circle.removeBorder();

    player2Circle.removeBorder();

    // Calculate angle based on remaining time
    const angle = (maxAngle * remainingTime) / TURN_DURATION;

    if (activePlayer === 1) {
      player1Circle.addBorder(angle, borderColor);
    } else {
      player2Circle.addBorder(angle, borderColor);
    }
  }
}

// Function to format the remaining time as minutes and seconds
function formatTime(milliseconds) {
  const minutes = Math.floor(milliseconds / 60000);
  const seconds = Math.floor((milliseconds % 60000) / 1000);
  return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
}
