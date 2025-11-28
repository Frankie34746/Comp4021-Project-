// Get the canvas and 2D context
const cv = $("#gameCanvas").get(0);
const context = canvas.getContext("2d");

canvas.width = 1920;
canvas.height = 1080;

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

// Useful Const and Variables (In-game)
const REQUIRED_TREASURES = 6;       // The # of necessary treasures to open the escape portal
let collectedTreasures = 0;         // The # of treasures collected

$("#register-form").on("submit", (e) => {
    // Do not submit the form
    e.preventDefault();

    // Get the input fields
    const username = $("#register-username").val().trim();

    if (!username) {
        $("#register-message").text("Username cannot be empty!");
        return;
    }

    ownUsername = username;

    // Send a register request
    Registration.register(username,
        () => {
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
                socket.emit("startGame", roomId);
            });

            socket.on("gameStart", () => {
                $("#lobbyPage").hide();
                $("#gamePage").show();
                initGame();
            });
        }
    );
});

$(function() {
    const gameArea = BoundingBox(context, 165, 60, 420, 800);

    const player = Player(context, 427, 240, gameArea); // The player

    setupInputListeners(player);

    function doFrame(now) {
        /* Process the next frame */
        player.update(now);
        context.clearRect(0, 0, cv.width, cv.height);
        player.draw();
    
        requestAnimationFrame(doFrame);
    }

    requestAnimationFrame(doFrame);
});

$("#frontPage").show();
$("#lobbyPage").hide();
$("#gamePage").hide();
$("#gameOverPage").hide();
$("#cheatIndicator").hide();
