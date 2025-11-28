console.log("dungeonQuest.js loaded");

// Get the canvas and 2D context
let canvas = null;
let context = null;

// Function to initialize canvas
const initCanvas = function() {
    console.log("initCanvas called");
    if (!canvas) {
        canvas = document.querySelector("canvas");
        if (!canvas) {
            console.error("Canvas element not found! Looking for:", $("canvas").length, "canvas elements");
            return false;
        }
        console.log("Canvas found:", canvas);
        
        context = canvas.getContext("2d");
        if (!context) {
            console.error("Could not get 2D context from canvas!");
            return false;
        }
        console.log("Canvas 2D context obtained");
        
        // Get container dimensions
        const container = canvas.parentElement;
        console.log("Container:", container);
        console.log("Container offsetWidth:", container.offsetWidth, "offsetHeight:", container.offsetHeight);
        
        // Use the container dimensions or fallback to fixed size
        let width = container.offsetWidth;
        let height = container.offsetHeight;
        
        if (width === 0 || height === 0) {
            // If container is not yet sized, use the CSS dimensions from game-container
            // From CSS: width: 800px; height: 500px;
            width = 800;
            height = 500;
            console.log("Container not yet sized, using fallback:", width, "x", height);
        }
        
        canvas.width = width;
        canvas.height = height;
        console.log("Canvas dimensions set to:", canvas.width, "x", canvas.height);

        // Draw initial background
        context.fillStyle = 'white'
        context.fillRect(0, 0, canvas.width, canvas.height)

        context.fillStyle = 'red'
        context.fillRect(100, 100, 100, 100)
        console.log("Initial canvas drawn");
    }
    return true;
};

// Initialize canvas on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOMContentLoaded event fired");
    initCanvas();
});

// Also try to initialize when jQuery is ready
$(function() {
    console.log("jQuery ready");
    initCanvas();
});

// Create the sounds objects
const sounds = {
    background: new Audio("./res/background.mp3"),
    collect: new Audio("./res/collect.mp3"),
    gameover: new Audio("./res/gameover.mp3")
}

// Useful Const and Variables (In-game)
const REQUIRED_TREASURES = 6;       // The # of necessary treasures to open the escape portal
let collectedTreasures = 0;         // The # of treasures collected

// DEBUG MODE: Check if debug parameter is in URL
const urlParams = new URLSearchParams(window.location.search);
const DEBUG_MODE = urlParams.get('debug') === 'true';

// Game State
const gameState = {
    currentScreen: 'frontPage',
    playerId: null,
    username: '',
    players: {},
    gameActive: false,
    level: 1,
    treasuresCollected: 0,
    totalTreasures: 5,
    timeTaken: 300,
    cheatMode: false,
    playerDeaths: { player1: 0, player2: 0 }
};

$("#register-form").on("submit", (e) => {
    console.log("Register form submitted");
    // Do not submit the form
    e.preventDefault();

    // Get the input fields
    const username = $("#register-username").val().trim();
    console.log("Username:", username);

    if (!username) {
        console.log("Username is empty");
        $("#register-message").text("Username cannot be empty!");
        return;
    }

    // Send a register request
    console.log("Calling Registration.register");
    Registration.register(username,
        () => {
            console.log("Registration callback executed");
            // DEBUG MODE: Skip lobby and go directly to game
            if (DEBUG_MODE) {
                console.log("DEBUG MODE ENABLED: Skipping lobby and starting game...");
                $("#frontPage").hide();
                $("#lobbyPage").hide();
                $("#gamePage").show();
                
                // Make sure canvas is initialized
                if (!initCanvas()) {
                    console.error("Failed to initialize canvas!");
                    return;
                }
                
                // Set game as active
                gameState.gameActive = true;
                gameState.username = username;
                gameState.currentScreen = 'gamePage';
                
                console.log("Scheduling initializeGame after 100ms");
                // Initialize game immediately
                setTimeout(() => {
                    console.log("setTimeout callback: calling initializeGame");
                    initializeGame();
                }, 100);
            } else {
                console.log("Normal mode: showing lobby");
                // Normal flow: go to lobby
                $("#frontPage").hide();
                $("#lobbyPage").show();
            }
        }
    );
});

$("#frontPage").show();
$("#lobbyPage").hide();
$("#gamePage").hide();
$("#gameOverPage").hide();

// ===================== GAME LOOP =====================

// Initialize game variables
let player = null;
let monsters = null;
let gameArea = null;
let gameLoopId = null;

// Initialize the game
const initializeGame = function() {
    console.log("Initializing game...");
    console.log("gameState.gameActive:", gameState.gameActive);
    console.log("canvas:", canvas);
    console.log("context:", context);
    console.log("canvas dimensions:", canvas.width, "x", canvas.height);
    
    if (gameState.gameActive) {
        try {
            // Create the game area (bounding box)
            console.log("Creating bounding box...");
            gameArea = BoundingBox(context, 150, 20, 430, 775);
            console.log("Bounding box created:", gameArea);
            
            // Create player in the specified position
            console.log("Creating player at position (427, 240)...");
            player = Player(context, 427, 240, gameArea);
            console.log("Player created:", player);
            
            // Create monsters
            console.log("Creating monsters...");
            monsters = [
                // Monster(context, 750, 240, gameArea),
                Monster(context, 50, 240, gameArea)
            ];
            console.log("Monsters created:", monsters);
            
            // Set up input listeners for player
            console.log("Setting up input listeners...");
            setupInputListeners(player);
            console.log("Input listeners set up");
            
            // Start the game loop
            console.log("Starting game loop...");
            gameLoopId = requestAnimationFrame(gameLoop);
            console.log("Game initialized and loop started");
        } catch (error) {
            console.error("Error initializing game:", error);
            console.error("Stack trace:", error.stack);
        }
    }
};

// Game loop function
let frameCount = 0;
const gameLoop = function(time) {
    frameCount++;
    if (frameCount % 60 === 0) {
        console.log("Frame:", frameCount, "Time:", time);
    }
    
    try {
        // Clear the canvas
        context.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw debug info
        context.fillStyle = 'black';
        context.font = '20px Arial';
        context.fillText('DEBUG: Frame ' + frameCount, 20, 40);
        
        // Update player
        if (player) {
            try {
                player.update(time);
            } catch (error) {
                console.error("Error updating player:", error);
                context.fillText('ERROR: ' + error.message, 20, 80);
            }
        } else {
            console.warn("player is null!");
            context.fillText('player is null', 20, 80);
        }
        
        // Update monsters
        if (monsters) {
            monsters.forEach(monster => {
                try {
                    monster.update(time);
                } catch (error) {
                    console.error("Error updating monster:", error);
                }
            });
        } else {
            console.warn("monsters is null!");
        }
        
        // Collision detection
        if (player && monsters) {
        for (let i = monsters.length - 1; i >= 0; i--) {
            const monster = monsters[i];
            const playerBB = player.getBoundingBox();
            const monsterBB = monster.getBoundingBox();
            if (player.getAttackBoundingBox().intersect(monsterBB)) {
                if (player.isAttacking()){
                    monsters.splice(i, 1);
                }
            }
            if (playerBB.intersect(monsterBB)) {
                    player.hurt(now);
            }
        }
        }
        
        // Draw player
        if (player) {
            try {
                player.draw();
                
                // Visualize attack box
            if (player.isAttacking()) {
            const attackBox = player.getAttackBoundingBox();
            context.strokeStyle = 'red';
            context.lineWidth = 2;
            context.strokeRect(
                attackBox.getLeft(),
                attackBox.getTop(),
                attackBox.getRight() - attackBox.getLeft(),
                attackBox.getBottom() - attackBox.getTop()
            );
        }
            } catch (error) {
                console.error("Error drawing player:", error);
            }
        }
        
        // Draw monsters
        if (monsters) {
            monsters.forEach(monster => {
                try {
                    monster.draw();
                } catch (error) {
                    console.error("Error drawing monster:", error);
                }
            });
        }
    } catch (error) {
        console.error("Error in game loop:", error);
    }
    
    // Continue the loop
    gameLoopId = requestAnimationFrame(gameLoop);
};


