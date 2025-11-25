// Get the canvas and 2D context
const canvas = $("canvas").get(0);
const context = canvas.getContext("2d");

canvas.width = 120 * 16;    // 1920p
canvas.height = 120 * 9;    // 1080p

context.fillStyle = 'white'
context.fillRect(0, 0, canvas.width, canvas.height)

// Create the sounds objects
const sounds = {
    background: new Audio("./res/background.mp3"),
    collect: new Audio("./res/collect.mp3"),
    gameover: new Audio("./res/gameover.mp3")
}

// Useful Const and Variables (In-game)
const REQUIRED_TREASURES = 6;       // The # of necessary treasures to open the escape portal
let collectedTreasures = 0;         // The # of treasures collected
