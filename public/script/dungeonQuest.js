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
            width = 1280;
            height = 704;
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

// Useful Const and Variables (Lobby)
let roomId;
let playerNum;
let ownUsername;
let partnerUsername;

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

    ownUsername = username;

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
                window.playerNum = playerNum;
                window.gameState = gameState;
                
                console.log("Scheduling initializeGame after 100ms");
                // Initialize game immediately with random mapIndex
                setTimeout(() => {
                    console.log("setTimeout callback: calling initializeGame");
                    const mapIndex = Math.floor(Math.random() * 3);
                    const spawnData = generateSpawnPositions(mapIndex);
                    initializeGame(mapIndex, spawnData);
                }, 100);
            } else {
                console.log("Normal mode: showing lobby");
                // Normal flow: go to lobby
                $("#frontPage").hide();
                $("#lobbyPage").show();

                Socket.connect();
                const socket = Socket.getSocket();
                socket.emit("joinLobby", username);
                
                socket.on("waiting", () => {
                    $("#waitingMessage").show();
                    $("#startGameBtn").hide();
                });

                socket.on("paired", (data) => {
                    roomId = data.roomId;
                    
                    window.roomId = data.roomId;
                    window.playerNum = ownUsername === data.player1 ? 1 : 2;
                    
                    partnerUsername = ownUsername === data.player1 ? data.player2 : data.player1;
                    playerNum = ownUsername === data.player1 ? 1 : 2;
                    $(".player-list-container p").text(`Your Mighty Partner is: ${partnerUsername}`);
                    $("#player1Name").text(data.player1);
                    $("#player2Name").text(data.player2);
                    $("#waitingMessage").hide();
                    if (playerNum === 1) {
                        $("#startGameBtn").show();
                    }
                });
                
                $("#startGameBtn").on("click", () => {
                    const mapIndex = Math.floor(Math.random() * 3);
                    // Player 1 generates spawn data and sends to server
                    const spawnData = generateSpawnPositions(mapIndex);
                    socket.emit("startGame", {roomId: roomId, mapIndex: mapIndex, spawnData: spawnData});
                });

                socket.on("gameStart", (data) => {
                    $("#lobbyPage").hide();
                    $("#gamePage").show();

                    // Set game as active
                    gameState.gameActive = true;
                    gameState.username = username;
                    gameState.currentScreen = 'gamePage';
                    window.playerNum = playerNum;
                    window.gameState = gameState;

                    initializeGame(data.mapIndex, data.spawnData);

                    socket.on("action", (data) => {
                        if (data.type === "move") {
                            remotePlayer.move(data.dir);
                        } else if (data.type === "stop") {
                            remotePlayer.stop(data.dir);
                        } else if (data.type === "jump") {
                            remotePlayer.jump();
                        } else if (data.type === "attack") {
                            remotePlayer.attack();
                        } else if (data.type === "speedUp") {
                            remotePlayer.speedUp();
                        } else if (data.type === "slowDown") {
                            remotePlayer.slowDown();
                        }
                    });

                    socket.on("killMonster", (data) => {
                        const index = monsters.findIndex(m => m.getId() === data.monsterId);
                        if (index > -1) {
                            monsters.splice(index, 1);
                        }
                    });

                    socket.on("updateHP", (data) => {
                        // Don't update HP if the local player has cheat mode enabled
                        if (gameState.cheatMode && data.playerNum === playerNum) {
                            return;
                        }
                        
                        if (data.playerNum === 1) {
                            player1.setHP(data.hp);
                            updateHPDisplay(1, data.hp);
                        } else if (data.playerNum === 2) {
                            player2.setHP(data.hp);
                            updateHPDisplay(2, data.hp);
                        }
                    });

                    socket.on("gameOver", (data) => {
                        if (gameState.gameActive) {
                            showGameOver();
                        }
                    });

                    // Listen for monster position sync (Player 2 receives from Player 1)
                    socket.on("syncMonsters", (data) => {
                        if (playerNum === 2 && monsters) {
                            data.monsters.forEach(syncData => {
                                const monster = monsters.find(m => m.getId() === syncData.id);
                                if (monster) {
                                    // Update monster position and direction
                                    monster.setXY(syncData.x, syncData.y);
                                    monster.setDirection(syncData.direction);
                                }
                            });
                        }
                    });

                    // Listen for player position sync
                    socket.on("syncPosition", (data) => {
                        if (data.playerNum === 1 && playerNum === 2) {
                            // Player 2 receives Player 1's position
                            player1.setXY(data.x, data.y);
                        } else if (data.playerNum === 2 && playerNum === 1) {
                            // Player 1 receives Player 2's position
                            player2.setXY(data.x, data.y);
                        }
                    });

                    // Listen for treasure collection sync
                    socket.on("collectTreasure", (data) => {
                        if (treasures) {
                            const index = treasures.findIndex(t => {
                                const pos = t.getXY();
                                return Math.abs(pos.x - data.x) < 5 && Math.abs(pos.y - data.y) < 5;
                            });
                            if (index > -1) {
                                treasures.splice(index, 1);
                                gameState.treasuresCollected++;
                                $("#treasureCount").text(`${gameState.treasuresCollected}`);
                            }
                        }
                    });

                    // Listen for pushblock position sync (Player 2 receives from Player 1)
                    socket.on("syncPushblocks", (data) => {
                        if (playerNum === 2 && pushblocks && data.pushblocks) {
                            data.pushblocks.forEach((pbData, index) => {
                                if (pushblocks[index]) {
                                    pushblocks[index].setXY(pbData.x, pbData.y);
                                }
                            });
                        }
                    });
                });
            }
        }
    );
});

$("#frontPage").show();
$("#lobbyPage").hide();
$("#gamePage").hide();
$("#gameOverPage").hide();

// ===================== GAME LOOP =====================

// Function to update HP display
const updateHPDisplay = function(playerNum, hp) {
    const maxHP = 3;
    const hpPercentage = (hp / maxHP) * 100;
    
    $(`#player${playerNum}HP`).text(hp);
    $(`#player${playerNum}Health`).css('width', hpPercentage + '%');
    
    // Optional: Add visual feedback for low HP
    if (hp <= 1) {
        $(`#player${playerNum}Health`).css('background-color', '#e74c3c');
    } else if (hp <= 2) {
        $(`#player${playerNum}Health`).css('background-color', '#f39c12');
    } else {
        $(`#player${playerNum}Health`).css('background-color', '#2ecc71');
    }
};

// Initialize game variables
// Define start positions (adjust as needed for your game area)
const player1StartX = 100;
const player2StartX = 150;
const startY = 704;

let player1 = null;
let player2 = null;
let localPlayer = null;
let remotePlayer = null;
let selectedMap = null;
let currentlevel = 1;
let remainingmapindex = [0,1,2]
let isTransitioning = false;

let monsters = null;

let gameArea = null;
let gameLoopId = null;
let gameStartTime = null; // Track when game starts

// Revive tracking
let lastReviveTime = { player1: 0, player2: 0 };
const REVIVE_COOLDOWN = 5000; // 5 seconds cooldown after revival

// Function to show game over screen
const showGameOver = function() {
    console.log("Game Over - Both players defeated!");
    
    // Stop the game loop
    gameState.gameActive = false;
    if (gameLoopId) {
        cancelAnimationFrame(gameLoopId);
        gameLoopId = null;
    }
    
    // Play game over sound
    sounds.gameover.play();
    
    // Calculate time taken
    const timeElapsed = Date.now() - gameStartTime;
    const minutes = Math.floor(timeElapsed / 60000);
    const seconds = Math.floor((timeElapsed % 60000) / 1000);
    const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    // Update game over page
    $("#player1DeathsLabel").text(`${ownUsername === $("#player1Name").text() ? ownUsername : partnerUsername} Deaths:`);
    $("#player2DeathsLabel").text(`${ownUsername === $("#player2Name").text() ? ownUsername : partnerUsername} Deaths:`);
    $("#player1Deaths").text(gameState.playerDeaths.player1);
    $("#player2Deaths").text(gameState.playerDeaths.player2);
    $("#finalTreasures").text(`${gameState.treasuresCollected}/${gameState.totalTreasures}`);
    $("#finalTime").text(timeString);
    
    // Only player 1 submits the score to avoid duplicates
    if (playerNum === 1) {
        submitScoreAndGetLeaderboard(ownUsername, partnerUsername, timeString);
    } else {
        // Player 2 just fetches the leaderboard
        fetchLeaderboard();
    }
    
    // Show game over page
    $("#gamePage").hide();
    $("#gameOverPage").show();
    
    // Set up play again button
    $("#playAgainBtn").off("click").on("click", () => {
        location.reload();
    });
};

// Function to submit score and get leaderboard in one request
const submitScoreAndGetLeaderboard = function(username, partner, timeTaken) {
    $.ajax({
        url: '/submitScore',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({
            username: username,
            partner: partner,
            timeTaken: timeTaken
        }),
        dataType: 'json',
        success: function(response) {
            if (response.status === 'success') {
                displayLeaderboard(response.leaderboard);
            } else {
                $("#rankingList").html('<li>Failed to save score</li>');
                console.error('Submit score error:', response.message);
            }
        },
        error: function(xhr, status, error) {
            $("#rankingList").html('<li>Failed to save score</li>');
            console.error('Submit score error:', error);
        }
    });
};

// Function to fetch and display leaderboard (fallback)
const fetchLeaderboard = function() {
    $.ajax({
        url: '/getLeaderboard',
        method: 'GET',
        dataType: 'json',
        success: function(response) {
            if (response.status === 'success') {
                displayLeaderboard(response.leaderboard);
            } else {
                $("#rankingList").html('<li>Failed to load leaderboard</li>');
            }
        },
        error: function() {
            $("#rankingList").html('<li>Failed to load leaderboard</li>');
        }
    });
};

// Function to display leaderboard
const displayLeaderboard = function(leaderboard) {
    const $rankingList = $("#rankingList");
    $rankingList.empty();
    
    if (leaderboard.length === 0) {
        $rankingList.html('<li>No records yet. Be the first!</li>');
        return;
    }
    
    leaderboard.forEach((entry, index) => {
        const className = index === 0 ? 'top-rank' : '';
        const $li = $('<li></li>')
            .addClass(className)
            .text(`${entry.username} & ${entry.partner} - ${entry.timeTaken}`);
        $rankingList.append($li);
    });
};

// Generate spawn positions for monsters and treasures (called by Player 1)
const generateSpawnPositions = function(mapIndex) {
    const tileSize = 32;
    const mapWidth = 40;
    
    // Get collision map data
    const collisionMaps = [map1, map2, map3];
    const collisions = collisionMaps[mapIndex];
    
    // Helper function to check if a position collides with map collision blocks
    const isPositionValid = function(x, y) {
        // Check distance from player spawn points
        const minDistanceFromPlayer = 200; // Minimum 200 pixels from player spawn
        const distToP1 = Math.sqrt(Math.pow(x - player1StartX, 2) + Math.pow(y - startY, 2));
        const distToP2 = Math.sqrt(Math.pow(x - player2StartX, 2) + Math.pow(y - startY, 2));
        
        if (distToP1 < minDistanceFromPlayer || distToP2 < minDistanceFromPlayer) {
            return false;
        }
        
        // Check collision with map tiles (expanded check area for safety)
        const checkRadius = 64; // Check 64 pixels around the spawn point
        for (let dx = -checkRadius; dx <= checkRadius; dx += tileSize) {
            for (let dy = -checkRadius; dy <= checkRadius; dy += tileSize) {
                const checkX = x + dx;
                const checkY = y + dy;
                
                // Calculate tile index
                const tileCol = Math.floor(checkX / tileSize);
                const tileRow = Math.floor(checkY / tileSize);
                const tileIndex = tileRow * mapWidth + tileCol;
                
                // Check if this tile is a collision tile (non-zero value)
                if (tileIndex >= 0 && tileIndex < collisions.length && collisions[tileIndex] !== 0) {
                    return false;
                }
            }
        }
        
        return true;
    };
    
    // Generate random valid position
    const generateValidPosition = function(minY = 100, maxY = 600) {
        let attempts = 0;
        const maxAttempts = 100;
        
        while (attempts < maxAttempts) {
            const x = 100 + Math.random() * (1180 - 100); // Range: 100 to 1180
            const y = minY + Math.random() * (maxY - minY);
            
            if (isPositionValid(x, y)) {
                return { x, y };
            }
            attempts++;
        }
        
        // Fallback to safe positions if random generation fails
        console.warn("Could not find valid random position, using fallback");
        return { x: 400 + Math.random() * 480, y: 300 };
    };
    
    // Generate 5 treasure positions with colors
    const treasurePositions = [];
    const colors = ["green", "red", "yellow", "purple"];
    for (let i = 0; i < 5; i++) {
        const pos = generateValidPosition(100, 550);
        pos.color = colors[i % 4]; // Assign color
        treasurePositions.push(pos);
    }
    
    // Generate monster positions (some with treasures)
    const monsterPositions = [];
    const numMonsters = 5; // Generate 5 monsters
    for (let i = 0; i < numMonsters; i++) {
        const pos = generateValidPosition(100, 600);
        // 40% chance for monster to have treasure
        pos.withTreasure = Math.random() < 0.4;
        monsterPositions.push(pos);
    }
    
    console.log("Generated spawn data:", { treasurePositions, monsterPositions });
    
    return {
        treasures: treasurePositions,
        monsters: monsterPositions
    };
};

// Initialize the game
const initializeGame = function(mapIndex, spawnData = null) {
    console.log("Initializing game with mapIndex:", mapIndex);
    console.log("gameState.gameActive:", gameState.gameActive);
    console.log("canvas:", canvas);
    console.log("context:", context);
    console.log("canvas dimensions:", canvas.width, "x", canvas.height);
    
    // Set game start time
    gameStartTime = Date.now();
    
    if (gameState.gameActive) {
        try {
            // Create the game area (bounding box)
            console.log("Creating bounding box...");
            gameArea = BoundingBox(context, 64, 32, canvas.height-64, canvas.width-32);
            console.log("Bounding box created:", gameArea);

            // Load multiple background images
            const bgImages = [
                new Image(),
                new Image(),
                new Image()
            ];
            bgImages[0].src = "/res/map1.png";
            bgImages[1].src = "/res/map2.png";
            bgImages[2].src = "/res/map3.png";

            let loadCount = 0;
            const onBgLoad = function() {
                loadCount++;
                if (loadCount === bgImages.length) {
                    console.log("All backgrounds loaded!");
                    // Build maps
                    console.log("Building maps...");
                    const maps = [
                        map(context, map1, bgImages[0]),
                        map(context, map2, bgImages[1]),
                        map(context, map3, bgImages[2])
                    ];
                    console.log("Maps built:", maps);

                    selectedMap = maps[mapIndex];
                    console.log("Selected map by index:", selectedMap);
                    
                    // Remove selected map index from remaining
                    remainingmapindex = remainingmapindex.filter(idx => idx !== mapIndex);

                    // Create player in the specified position
                    console.log("Creating player1 and player2 at position (100, 240) and (700, 240) respectively...");
                    player1 = Player(context, player1StartX, startY, gameArea, selectedMap);
                    player2 = Player(context, player2StartX, startY, gameArea, selectedMap);
                    players = [player1,player2];
                    console.log("Player created:", player1);
                    console.log("Player created:", player2);
                    if (playerNum === 1) {
                        localPlayer = player1;
                        remotePlayer = player2;
                    } else {
                        localPlayer = player2;
                        remotePlayer = player1;
                    }
                            
                    // Create monsters and treasures based on spawn data
                    console.log("Creating monsters and treasures from spawn data...");
                    
                    // If no spawn data (debug mode), generate it
                    if (!spawnData) {
                        console.log("No spawn data provided, generating new spawn data...");
                        spawnData = generateSpawnPositions(mapIndex);
                    }
                    
                    // Create monsters from spawn data
                    monsters = [];
                    spawnData.monsters.forEach((monsterData, index) => {
                        const monster = Monster(context, monsterData.x, monsterData.y, gameArea, selectedMap, monsterData.withTreasure);
                        monsters.push(monster);
                    });
                    console.log(`Created ${monsters.length} monsters`);
                    
                    // Create treasures from spawn data
                    treasures = [];
                    spawnData.treasures.forEach((treasureData, index) => {
                        const treasureObj = treasure(context, treasureData.x, treasureData.y, treasureData.color || "green");
                        treasures.push(treasureObj);
                    });
                    console.log(`Created ${treasures.length} treasures`);

                    // Create pushblocks
                    console.log("Creating pushblocks...");
                    pushblocks = [
                        pushblock(context, 256, 512, 2, 2,gameArea,selectedMap) 
                    ];
                    console.log("PushBlocks created:", pushblocks);
                    
                    // Create portal
                    console.log("Creating portal...");
                    Portal = portal(context, player1StartX, startY-90) 
                    console.log("portal created:", Portal);
                    
                    // Set up input listeners for player
                    console.log("Setting up input listeners...");
                    setupInputListeners(localPlayer);
                    console.log("Input listeners set up");
                    
                    // Make gameState and players globally accessible for cheat mode
                    window.gameState = gameState;
                    window.player = localPlayer;
                    
                    // Start the game loop
                    console.log("Starting game loop...");
                    gameLoopId = requestAnimationFrame(gameLoop);
                    console.log("Game initialized and loop started");
                }
            };

            bgImages.forEach(bg => bg.onload = onBgLoad);

        } catch (error) {
            console.error("Error initializing game:", error);
            console.error("Stack trace:", error.stack);
        }
    }
};

// Function to jump to next level
const jumptonextlevel = function() {
    console.log(currentlevel)
    if (currentlevel < 3) {
        currentlevel++;
        
        // Pick random from remaining
        const randIdx = Math.floor(Math.random() * remainingmapindex.length);
        const nextMapIndex = remainingmapindex[randIdx];
        remainingmapindex.splice(randIdx, 1);
        
        // Generate new spawn data
        const newSpawnData = generateSpawnPositions(nextMapIndex);
        
        // For multiplayer sync (host only)
        if (!DEBUG_MODE && playerNum === 1) {
            const socket = Socket.getSocket();
            if (socket && window.roomId) {
                socket.emit("nextLevel", { 
                    roomId: window.roomId, 
                    nextMapIndex: nextMapIndex,
                    spawnData: newSpawnData
                });
            }
        }
        
        // Reset level-specific state
        gameState.treasuresCollected = 0;
        $("#treasureCount").text(`${gameState.treasuresCollected}`);
        gameState.gameActive = true;
        isTransitioning = false;
        
        // Initialize next level
        initializeGame(nextMapIndex, newSpawnData);
    } else {
        const socket = Socket.getSocket();
        if (socket && window.roomId) {
            socket.emit("gameOver", { roomId: window.roomId });
        }
        showGameOver();
    }
};

// Game loop function
let frameCount = 0;
let lastSyncTime = 0;
const SYNC_INTERVAL = 100; // Sync every 100ms (10 times per second)

const gameLoop = function(time) {
    frameCount++;
    if (frameCount % 60 === 0) {
        console.log("Frame:", frameCount, "Time:", time);
    }
    
    try {
        // Periodic synchronization (Player 1 sends updates to Player 2)
        if (!DEBUG_MODE && playerNum === 1 && time - lastSyncTime > SYNC_INTERVAL) {
            const socket = Socket.getSocket();
            if (socket && window.roomId) {
                // Sync monster positions and directions
                const monsterData = monsters.map(m => ({
                    id: m.getId(),
                    x: m.getXY().x,
                    y: m.getXY().y,
                    direction: m.getDirection()
                }));
                socket.emit("syncMonsters", { roomId: window.roomId, monsters: monsterData });
                
                // Sync player 1 position
                socket.emit("syncPosition", { 
                    roomId: window.roomId, 
                    playerNum: 1,
                    x: player1.getXY().x,
                    y: player1.getXY().y
                });
                
                // Sync pushblock positions
                const pushblockData = pushblocks.map(pb => ({
                    x: pb.getXY().x,
                    y: pb.getXY().y
                }));
                socket.emit("syncPushblocks", { roomId: window.roomId, pushblocks: pushblockData });
            }
            lastSyncTime = time;
        }
        
        // Player 2 also sends position updates
        if (!DEBUG_MODE && playerNum === 2 && time - lastSyncTime > SYNC_INTERVAL) {
            const socket = Socket.getSocket();
            if (socket && window.roomId) {
                // Sync player 2 position
                socket.emit("syncPosition", { 
                    roomId: window.roomId, 
                    playerNum: 2,
                    x: player2.getXY().x,
                    y: player2.getXY().y
                });
            }
            lastSyncTime = time;
        }
        
        // Clear the canvas
        context.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw map
        if (selectedMap) {
            selectedMap.draw();
        }

       // Draw portal if collected enough treasure
        if (gameState.treasuresCollected >= 5)
            Portal.draw();
        
        // Draw debug info
        context.fillStyle = 'black';
        context.font = '20px Arial';
        context.fillText('DEBUG: Frame ' + frameCount, 20, 40);
        
        // Update players
        player1.update(time);
        player2.update(time);


        // Apply flash effect for invulnerable players
        const flashInterval = 150; // Flash every 150ms
        const shouldFlash = Math.floor(time / flashInterval) % 2 === 0;
        
        context.save();
        if (player1.getIsInvulnerable(time) && shouldFlash) {
            context.globalAlpha = 0.3;
        }
        player1.draw();
        context.restore();

        context.save();
        if (player2.getIsInvulnerable(time) && shouldFlash) {
            context.globalAlpha = 0.3;
        }
        player2.draw();
        context.restore();

        // Update monsters
        if (monsters) {
            monsters.forEach(monster => {
                monster.update(time);
            });
        }
        // Update treasures
        if (treasures) {
            treasures.forEach(treasure => {
                treasure.update(time);
            });
        }

        // Update pushblocks
        if (pushblocks) {
            pushblocks.forEach(pushblock => {
                pushblock.update(time, gameArea, pushblocks);
            });
        }
        
        // Update portal
        Portal.update(time);
        
        // Collision detection
        if (monsters && player1 && player2) {
            for (let i = monsters.length - 1; i >= 0; i--) {
                const monster = monsters[i];
                const monsterBB = monster.getBoundingBox();

                // Player 1 collisions
        const p1BB = player1.getBoundingBox();
        const p1AttackBB = player1.getAttackBoundingBox();
if (p1AttackBB.intersect(monsterBB) && player1.isAttacking()) {
    if (monster.takeDamage(time,player1.getfacing())) {  // Uses cooldown!
        console.log(`Monster ${monster.getId()} hit! HP: ${monster.getHp()}`);
        
        if (monster.getHp() <= 0) {
            if (monster.getwithtreasure()) {
                treasures.push(monster.droptreasure());
                console.log("Treasure dropped!");
            }
            const socket = Socket.getSocket();
            socket.emit("killMonster", { roomId: window.roomId, monsterId: monster.getId() });
            monsters.splice(i, 1);
            continue;
        }
    }
}
                if (p1BB.intersect(monsterBB)) {
                    if (player1.hurt(time)) {
                        const currentHP = player1.getHP();
                        updateHPDisplay(1, currentHP);
                        if (currentHP <= 0) {
                            gameState.playerDeaths.player1++;
                        }
                        const socket = Socket.getSocket();
                        socket.emit("updateHP", { 
                            roomId: window.roomId, 
                            playerNum: 1, 
                            hp: currentHP
                        });
                    }
                }

                // Player 2 collisions (same pattern)
        const p2BB = player2.getBoundingBox();
        const p2AttackBB = player2.getAttackBoundingBox();
if (p1AttackBB.intersect(monsterBB) && player2.isAttacking()) {
    if (monster.takeDamage(time,player2.getfacing())) {  // Uses cooldown!
        console.log(`Monster ${monster.getId()} hit! HP: ${monster.getHp()}`);
        
        if (monster.getHp() <= 0) {
            if (monster.getwithtreasure()) {
                treasures.push(monster.droptreasure());
                console.log("Treasure dropped!");
            }
            const socket = Socket.getSocket();
            socket.emit("killMonster", { roomId: window.roomId, monsterId: monster.getId() });
            monsters.splice(i, 1);
            continue;
        }
    }
}
                if (p2BB.intersect(monsterBB)) {
                    if (player2.hurt(time)) {
                        const currentHP = player2.getHP();
                        updateHPDisplay(2, currentHP);
                        if (currentHP <= 0) {
                            gameState.playerDeaths.player2++;
                        }
                        const socket = Socket.getSocket();
                        socket.emit("updateHP", { 
                            roomId: window.roomId, 
                            playerNum: 2, 
                            hp: currentHP
                        });
                    }
                }
            }
        }

        // Check if both players are dead - Game Over
        if (player1 && player2) {
            const p1HP = player1.getHP();
            const p2HP = player2.getHP();

            if (p1HP <= 0 && p2HP <= 0 && gameState.gameActive) {
                // Both players are dead - trigger game over
                const socket = Socket.getSocket();
                if (socket && window.roomId) {
                    socket.emit("gameOver", { roomId: window.roomId });
                }
                showGameOver();
                return; // Stop processing this frame
            }
        }

        // Player-to-player collision for revive
        if (player1 && player2) {
            const p1BB = player1.getBoundingBox();
            const p2BB = player2.getBoundingBox();
            const p1HP = player1.getHP();
            const p2HP = player2.getHP();

            // Check if players are touching
            if (p1BB.intersect(p2BB)) {
                // If player1 is dead (HP = 0) and player2 is alive, revive player1
                if (p1HP <= 0 && p2HP > 0 && (time - lastReviveTime.player1 > REVIVE_COOLDOWN)) {
                    player1.setHP(3);
                    updateHPDisplay(1, 3);
                    const socket = Socket.getSocket();
                    socket.emit("updateHP", { 
                        roomId: window.roomId, 
                        playerNum: 1, 
                        hp: 3
                    });
                    lastReviveTime.player1 = time;
                    console.log("Player 1 revived by Player 2!");
                }
                // If player2 is dead (HP = 0) and player1 is alive, revive player2
                else if (p2HP <= 0 && p1HP > 0 && (time - lastReviveTime.player2 > REVIVE_COOLDOWN)) {
                    player2.setHP(3);
                    updateHPDisplay(2, 3);
                    const socket = Socket.getSocket();
                    socket.emit("updateHP", { 
                        roomId: window.roomId, 
                        playerNum: 2, 
                        hp: 3
                    });
                    lastReviveTime.player2 = time;
                    console.log("Player 2 revived by Player 1!");
                }
            }
        }
                
        // Collect treasures
        if (treasures && player1 && player2) {
            for (let i = treasures.length - 1; i >= 0; i--) {
                const treasure = treasures[i];
                const treasureBB = treasure.getBoundingBox();

                const p1BB = player1.getBoundingBox();
                const p2BB = player2.getBoundingBox();

                if (p1BB.intersect(treasureBB) || p2BB.intersect(treasureBB)) {
                    const treasurePos = treasure.getXY();
                    treasures.splice(i, 1);
                    gameState.treasuresCollected++;
                    console.log("Now u have ", gameState.treasuresCollected," treasure(s)");
                    $("#treasureCount").text(`${gameState.treasuresCollected}`);
                    
                    // Sync treasure collection to other player
                    if (!DEBUG_MODE) {
                        const socket = Socket.getSocket();
                        if (socket && window.roomId) {
                            socket.emit("collectTreasure", { 
                                roomId: window.roomId, 
                                x: treasurePos.x, 
                                y: treasurePos.y 
                            });
                        }
                    }
                }
            }
        }

        // Check for level completion: both players in portal (host only)
        if (gameState.treasuresCollected >= 5) {
                const portalBB = Portal.getBoundingBox();
                const p1BB = player1.getBoundingBox();
                const p2BB = player2.getBoundingBox();
                
                console.log("Portal opens!...");
                if (p1BB.intersect(portalBB) && p2BB.intersect(portalBB) && !isTransitioning) {
                    console.log("Both players entered portal! Advancing to next level...");
                    isTransitioning = true;
                    
                    // Cancel current game loop
                    cancelAnimationFrame(gameLoopId);
                    
                    gameState.gameActive = false;
                    jumptonextlevel();
                    
                    return;  // Stop current frame
                }
        }
        

        // Draw monsters
        if (monsters) {
            monsters.forEach(monster => {
                monster.draw();
            });
        }
                
        // Draw treasures
        if (treasures) {
            treasures.forEach(treasure => {
                treasure.draw();
            });
        }

        // Update pushblocks
        if (pushblocks) {
            pushblocks.forEach(pushblock => {
                pushblock.draw();
            });
        }
    
    
        
    } catch (error) {
        console.error("Error in game loop:", error);
    }
    
    // Continue the loop
    gameLoopId = requestAnimationFrame(gameLoop);
};
