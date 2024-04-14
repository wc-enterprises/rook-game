const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static("public"));

// Define the initial duration for the timer
let TURN_DURATION = 5000; // 60 seconds

// Initialize the remaining time
let remainingTime = TURN_DURATION;
let playerCount = 0;
let timerInterval;
let players = [];
let currentPlayerIndex = 0;
let s;

// Function to update the remaining time and broadcast it to the active player
function updateTimer() {
  remainingTime -= 1000;

  io.emit("timerUpdate", {
    remainingTime,
    activePlayer: currentPlayerIndex + 1,
    playerName: Object.keys(playerNames)[currentPlayerIndex],
  });
  console.log(
    `Time remaining for ${
      Object.keys(playerNames)[currentPlayerIndex]
    }: ${remainingTime}`
  );
}

// Function to start the timer for the current player's turn
function startTurnTimer() {
  remainingTime = TURN_DURATION;
  io.emit("timerUpdate", {
    remainingTime,
    activePlayer: currentPlayerIndex + 1,
    playerName: Object.keys(playerNames)[currentPlayerIndex],
  });
  console.log(
    `Time remaining for ${
      Object.keys(playerNames)[currentPlayerIndex]
    }: ${remainingTime}`
  );
  timerInterval = setInterval(updateTimer, 1000);
}

// Function to stop the timer for the current player's turn
function stopTurnTimer() {
  clearInterval(timerInterval);
}

// Initialize an empty object to store player names and their socket IDs
let playerNames = {};
const MAX_PLAYERS = 2;

// When a new player connects
io.on("connection", (socket) => {
  // Assign a player name or remove previous player names if any tab is reloaded
  let playerName = assignPlayerName(socket);
  // Add the player to the players array
  players.push(socket);
  console.log("players", players.length);

  // Send a message to the client indicating their assigned name
  socket.emit("connected", {
    message: `You are connected as ${playerName}`,
    playerName,
  });

  // Listen for rook position updates from the client (Abin or Bhanu)
  socket.on("rookPosition", (data) => {
    // Broadcast the rook's position to all connected clients (including Bhanu)
    io.emit("rookPosition", data);
  });

  socket.on("gameEnd", (data) => {
    stopTurnTimer();
    clearInterval(s);
    io.emit("gameEnd", data);
  });

  playerCount++;

  // When a player disconnects
  socket.on("disconnect", () => {
    // Remove the disconnected player's name from the playerNames object
    removePlayerName(socket.id);

    playerCount--;

    // Remove the disconnected player from the players array
    players = players.filter((player) => player !== socket);

    // If both players are disconnected, stop the turn timer
    if (players.length === 0) {
      stopTurnTimer();
    }
  });
});

// Function to switch turns between players
function switchTurns() {
  // Stop the timer for the current player
  stopTurnTimer();

  // Increment the current player index to switch to the next player
  currentPlayerIndex = (currentPlayerIndex + 1) % MAX_PLAYERS;

  // Start the timer for the next player's turn
  startTurnTimer();
}

startTurnTimer();
// Start switching turns after each player's turn duration
s = setInterval(switchTurns, TURN_DURATION + 1000);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Function to assign a player name
function assignPlayerName(socket) {
  let playerName;

  // If the socket is already assigned a name, remove it
  removePlayerName(socket.id);

  // Count the number of players currently connected
  let numPlayers = Object.keys(playerNames).length;

  // Check if the maximum number of players has been reached
  if (numPlayers >= MAX_PLAYERS) {
    // If the room is full, remove all player names
    resetPlayerNames();
  }

  // Assign player name based on availability
  if (!playerNames["Abin"]) {
    playerName = "Abin";
  } else if (!playerNames["Bhanu"]) {
    playerName = "Bhanu";
  } else {
    // If both names are taken, assign a generic name
    playerName = `Player${numPlayers + 1}`;
  }

  // Store the assigned player name in the playerNames object
  playerNames[playerName] = socket.id;

  return playerName;
}

// Function to remove a player name based on socket ID
function removePlayerName(socketId) {
  Object.keys(playerNames).forEach((name) => {
    if (playerNames[name] === socketId) {
      delete playerNames[name];
    }
  });
}

// Function to remove all player names
function resetPlayerNames() {
  playerNames = {};
}
