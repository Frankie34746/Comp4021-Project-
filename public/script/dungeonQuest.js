// Get the canvas and 2D context
const canvas = $("canvas").get(0);
const context = canvas.getContext("2d");

canvas.width = 120 * 16;    // 1920p
canvas.height = 120 * 9;    // 1080p

// Create the sounds objects
const sounds = {
    background: new Audio("./res/background.mp3"),
    collect: new Audio("./res/collect.mp3"),
    gameover: new Audio("./res/gameover.mp3")
}

// Useful Const and Variables (In-game)
const REQUIRED_TREASURES = 6;       // The # of necessary treasures to open the escape portal
let collectedTreasures = 0;         // The # of treasures collected

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
    // Do not submit the form
    e.preventDefault();

    // Get the input fields
    const username = $("#register-username").val().trim();

    if (!username) {
        $("#register-message").text("Username cannot be empty!");
        return;
    }

    // Send a register request
    Registration.register(username,
        () => {
            $("#frontPage").hide();
            $("#lobbyPage").show();
        }
    );
});

$("#frontPage").show();
$("#lobbyPage").hide();
$("#gamePage").hide();
$("#gameOverPage").hide();

