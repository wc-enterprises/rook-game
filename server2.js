const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public2'));

const TIMER = 5000;

let players = {};  // Stores socket IDs for top and bottom players
let names = { top: 'Top Player', bottom: 'Bottom Player' };
let turnTimer;     // Stores the timer for automatic turn switching
let activePlayer = null;  // To indicate the currently active player

io.on('connection', (socket) => {
    console.log('A user connected: ' + socket.id);

    // Assign player roles
    if (!players.top) {
        players.top = socket.id;
        activePlayer = socket.id;  // Make the first player active by default
    } else if (!players.bottom) {
        players.bottom = socket.id;
        // Start turn timer when both players are present
        turnTimer = setInterval(switchTurns, TIMER);

        // When both top and bottom players are set emit "activePlayer" event
        io.emit('activePlayer', { players, activePlayer});
    } else {
        // socket.emit('role', 'spectator');
    }

    
   

    socket.on('set-name', (name) => {
        if (socket.id === players.top) {
            names.top = name;
        } else if (socket.id === players.bottom) {
            names.bottom = name;
        }
        io.emit('update-names', names);
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected: ' + socket.id);
        if (players.top === socket.id) {
            clearInterval(turnTimer);  // Stop the timer if one player disconnects
            delete players.top;
            names.top = 'Top Player';
        } else if (players.bottom === socket.id) {
            clearInterval(turnTimer);  // Stop the timer if one player disconnects
            delete players.bottom;
            names.bottom = 'Bottom Player';
        }

           // Reset active player if the disconnected one was active
           if (activePlayer === socket.id) {
            activePlayer = players.top ? players.top : players.bottom;
        }

        io.emit('update-names', names);
    });

    socket.on('switch', () => {
        clearInterval(turnTimer);  // Reset timer on manual switch
        switchTurns();
        turnTimer = setInterval(switchTurns, TIMER);  // Restart the timer
    });
});

function switchTurns() {
    if (players.top && players.bottom) {  // Ensure both players are connected
        activePlayer = (activePlayer === players.top) ? players.bottom : players.top;
        io.emit('activePlayer', { players, activePlayer});
    }
}

server.listen(4000, () => {
    console.log('listening on *:4000');
});
