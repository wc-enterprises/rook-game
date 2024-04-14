const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static("public"));

// // When a new player connects
// io.on("connection", (socket) => {
//   // Assign a player name
//   let playerName = assignPlayerName(socket);

//   // Send a message to the client indicating their assigned name
//   socket.emit("connected", { message: `You are connected as ${playerName}` });

//   // Listen for rook position updates from the client (Abin or Bhanu)
//   socket.on("rookPosition", (data) => {
//     // Broadcast the rook's position to all connected clients (including Bhanu)
//     io.emit("rookPosition", data);
//   });
// });

// // Function to assign a player name
// function assignPlayerName(socket) {
//   let playerName;

//   // Count the number of players currently connected
//   let numPlayers = Object.keys(playerNames).length;

//   // Check if the maximum number of players has been reached
//   if (numPlayers >= MAX_PLAYERS) {
//     // If the room is full, emit a "Room is full" message to the client and return a placeholder name
//     socket.emit("roomFull", { message: "Room is full" });
//     return "Room is full";
//   }

//   // Assign player name based on availability
//   if (!playerNames["Abin"]) {
//     playerName = "Abin";
//   } else if (!playerNames["Bhanu"]) {
//     playerName = "Bhanu";
//   } else {
//     // If both names are taken, assign a generic name
//     playerName = `Player${numPlayers + 1}`;
//   }

//   // Store the assigned player name in the playerNames object
//   playerNames[playerName] = socket.id;

//   return playerName;
// }

// Initialize an empty object to store player names and their socket IDs
let playerNames = {};
const MAX_PLAYERS = 2;

// When a new player connects
io.on("connection", (socket) => {
  // Assign a player name or remove previous player names if any tab is reloaded
  let playerName = assignPlayerName(socket);

  // Send a message to the client indicating their assigned name
  socket.emit("connected", { message: `You are connected as ${playerName}` });

  // Listen for rook position updates from the client (Abin or Bhanu)
  socket.on("rookPosition", (data) => {
    // Broadcast the rook's position to all connected clients (including Bhanu)
    io.emit("rookPosition", data);
  });

  // When a player disconnects
  socket.on("disconnect", () => {
    // Remove the disconnected player's name from the playerNames object
    removePlayerName(socket.id);
  });
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

// When a player disconnects
io.on("disconnect", (socket) => {
  // Find the disconnected player's name and remove it from the playerNames object
  let disconnectedPlayerName = Object.keys(playerNames).find(
    (name) => playerNames[name] === socket.id
  );
  if (disconnectedPlayerName) {
    delete playerNames[disconnectedPlayerName];
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
