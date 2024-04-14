const socket = io();
const switchButton = document.getElementById('switch-button');
let playerName = '';

function setName() {
    playerName = document.getElementById('player-name').value;
    if (playerName.trim() === '') {
        alert('Please enter a valid name.');
        return;
    }
    socket.emit('set-name', playerName);
    document.getElementById('name-entry').style.display = 'none';
}

function switchPlayers(){
    socket.emit('switch');
      // Clear previous states
      switchButton.classList.remove('top-disabled', 'bottom-disabled');
}



socket.on('update-names', (names) => {
    document.getElementById('top-info').textContent = names.top;
    document.getElementById('bottom-info').textContent = names.bottom;
});

socket.on('activePlayer', (data) => {
    const { players, activePlayer } = data;

    console.log("Turn event listner triggered:", 'Active player Id ->', activePlayer, "Event emitting socket id->",socket.id, "player id list->", players)
    console.log()
    document.getElementById('top-player').classList.remove('active');
    document.getElementById('bottom-player').classList.remove('active');

    if (players?.top === activePlayer) {
        document.getElementById('top-player').classList.add('active');
          // Clear previous states
        switchButton.classList.add( 'bottom-disabled');
    } else if (players?.bottom === activePlayer) {
        document.getElementById('bottom-player').classList.add('active');
        switchButton.classList.add( 'top-disabled');
    } 
});

// Interval switch logic should be server-controlled to prevent client-side manipulation
