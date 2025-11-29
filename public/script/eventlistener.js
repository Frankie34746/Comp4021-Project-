/**
 * Sets up keydown and keyup event listeners to control the player.
 * @param {object} player - The player object with move, stop, speedUp, and slowDown methods.
 */
function setupInputListeners(player) {
    // Keydown handler
        const LEFT_ARROW = 37;
        const Right_ARROW = 39;
        const UP_ARROW = 38;
        const SLASH = 191;
        const A = 65;
        const W= 87;
        const D = 68;
        const SPACEBAR = 32;
        const J = 74;
        const socket = Socket.getSocket();

    $(document).on("keydown", function(event) {
        // Arrow keys and Spacebar key codes
        
        // This is a common pattern to prevent default browser actions (like scrolling)
        // when arrow keys or spacebar are pressed.

        // Check for C key to toggle cheat mode
        const C = 67;
        if (event.keyCode === C) {
            // Toggle cheat mode in game state
            if (typeof gameState !== 'undefined') {
                gameState.cheatMode = !gameState.cheatMode;
                
                // Update player-info background color for the correct player
                const playerNumber = typeof window.playerNum !== 'undefined' ? window.playerNum : 1;
                const playerInfoId = playerNumber === 1 ? 'player1Info' : 'player2Info';
                const playerInfo = document.getElementById(playerInfoId);
                if (playerInfo) {
                    if (gameState.cheatMode) {
                        playerInfo.classList.add('cheat-active');
                    } else {
                        playerInfo.classList.remove('cheat-active');
                    }
                }
                
                // Update player invincibility
                if (typeof player.setCheatMode === 'function') {
                    player.setCheatMode(gameState.cheatMode);
                }
                
                console.log('Cheat mode:', gameState.cheatMode ? 'ENABLED' : 'DISABLED', 'for Player', playerNumber);
            }
            return;
        }

        // Don't allow any actions if player is dead
        if (player.getHP() <= 0) return;

        if (!player.isAttacking()) {
            switch (event.keyCode) {
                case A:
                    player.move(1);
                    socket.emit("action", { roomId: window.roomId, type: "move", dir: 1 });
                    break;
                case W:
                    player.jump();
                    socket.emit("action", { roomId: window.roomId, type: "jump" });
                    break;
                case D:
                    player.move(3);
                    socket.emit("action", { roomId: window.roomId, type: "move", dir: 3 });
                    break;
                case SPACEBAR:
                    player.speedUp();
                    socket.emit("action", { roomId: window.roomId, type: "speedUp" });
                    break;
                case J:
                    player.attack();
                    socket.emit("action", { roomId: window.roomId, type: "attack" });
                    break;
                default:
                    console.log(event.keyCode);
                    break;
            }

            switch (event.keyCode) {
                case LEFT_ARROW:
                    player.move(1);
                    socket.emit("action", { roomId: window.roomId, type: "move", dir: 1 });
                    break;
                case UP_ARROW:
                    player.jump();
                    socket.emit("action", { roomId: window.roomId, type: "jump" });
                    break;
                case Right_ARROW:
                    player.move(3);
                    socket.emit("action", { roomId: window.roomId, type: "move", dir: 3 });
                    break;
                case SPACEBAR:
                    player.speedUp();
                    socket.emit("action", { roomId: window.roomId, type: "speedUp" });
                    break;
                case SLASH:
                    player.attack();
                    socket.emit("action", { roomId: window.roomId, type: "attack" });
                    break;
                default:
                    console.log(event.keyCode);
                    break;
            }
        }
    });

    $(document).on("keyup", function(event) {
        // Don't allow any actions if player is dead
        if (player.getHP() <= 0) return;

        if (!player.isAttacking()) {
            switch (event.keyCode) {
                case A:
                    player.stop(1);
                    socket.emit("action", { roomId: window.roomId, type: "stop", dir: 1 });
                    break;
                case D:
                    player.stop(3);
                    socket.emit("action", { roomId: window.roomId, type: "stop", dir: 3 });
                    break;
                case SPACEBAR:
                    player.slowDown();
                    socket.emit("action", { roomId: window.roomId, type: "slowDown" });
                    break;
            }

            switch (event.keyCode) {
                case LEFT_ARROW:
                    player.stop(1);
                    socket.emit("action", { roomId: window.roomId, type: "stop", dir: 1 });
                    break;
                case Right_ARROW:
                    player.stop(3);
                    socket.emit("action", { roomId: window.roomId, type: "stop", dir: 3 });
                    break;
                case SPACEBAR:
                    player.slowDown();
                    socket.emit("action", { roomId: window.roomId, type: "slowDown" });
                    break;
            }
        }
    });
}
