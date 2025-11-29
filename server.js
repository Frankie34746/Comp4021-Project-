const express = require("express");
const fs = require("fs");

// Create the Express app
const app = express();

// Use the 'public' folder to serve static files
app.use(express.static("public"));

// Use the json middleware to parse JSON data
app.use(express.json());

// Handle the /getLeaderboard endpoint
app.get("/getLeaderboard", (req, res) => {
    try {
        const leaderboard = JSON.parse(fs.readFileSync("./data/leaderboard.json"));
        const sortedLeaderboard = getSortedLeaderboard(leaderboard);
        res.json({ status: "success", leaderboard: sortedLeaderboard });
    } catch (error) {
        res.json({ status: "error", message: "Failed to load leaderboard" });
    }
});

// Helper function to parse time string to seconds
function parseTimeToSeconds(timeStr) {
    const parts = timeStr.split(':');
    if (parts.length === 2) {
        return parseInt(parts[0]) * 60 + parseInt(parts[1]);
    }
    return 999999; // Invalid time goes to the end
}

// Helper function to get sorted leaderboard array
function getSortedLeaderboard(leaderboardData) {
    const leaderboardArray = Object.entries(leaderboardData).map(([username, data]) => ({
        username,
        partner: data.partner,
        timeTaken: data.timeTaken
    }));
    
    leaderboardArray.sort((a, b) => {
        const timeA = parseTimeToSeconds(a.timeTaken);
        const timeB = parseTimeToSeconds(b.timeTaken);
        return timeA - timeB;
    });
    
    return leaderboardArray.slice(0, 10);
}

// Handle the /submitScore endpoint - Submit score and get updated leaderboard
app.post("/submitScore", (req, res) => {
    try {
        const { username, partner, timeTaken } = req.body;
        
        // Validate input
        if (!username || !partner || !timeTaken) {
            return res.json({ status: "error", message: "Missing required fields" });
        }
        
        // Read current leaderboard
        let leaderboard = {};
        try {
            leaderboard = JSON.parse(fs.readFileSync("./data/leaderboard.json"));
        } catch (error) {
            // If file doesn't exist or is invalid, start with empty object
            leaderboard = {};
        }
        
        // Add or update the score
        // Only update if it's a better (faster) time or first time
        if (!leaderboard[username] || 
            parseTimeToSeconds(timeTaken) < parseTimeToSeconds(leaderboard[username].timeTaken)) {
            leaderboard[username] = {
                partner: partner,
                timeTaken: timeTaken
            };
            
            // Save updated leaderboard
            fs.writeFileSync("./data/leaderboard.json", JSON.stringify(leaderboard, null, " "));
        }
        
        // Return updated leaderboard
        const sortedLeaderboard = getSortedLeaderboard(leaderboard);
        res.json({ status: "success", leaderboard: sortedLeaderboard });
    } catch (error) {
        console.error("Error submitting score:", error);
        res.json({ status: "error", message: "Failed to submit score" });
    }
});

// Handle the /enterDungeon endpoint
app.post("/enterDungeon", (req, res) => {
    // Get the JSON data from the body
    const { username } = req.body;

    //
    // D. Reading the users.json file
    //
    const users = JSON.parse(fs.readFileSync("./data/users.json"));

    //
    // G. Adding the new user account
    //
    if (users[username]) {
        users[username].playCount += 1;
    }
    else {
        users[username] = {"playCount": 1};
    }
    //
    // H. Saving the users.json file
    //
    fs.writeFileSync("./data/users.json", JSON.stringify(users, null, " "));

    //
    // I. Sending a success response to the browser
    //
    res.json({ status: "success", username: username })
});

// -------------------------------------------------------------- WebSockets -------------------------------------------------------------- //
const { Server } = require("socket.io");
const { createServer } = require("http");
const httpServer = createServer( app );
const io = new Server(httpServer);

let waitingSocket = null;

io.on("connection", (socket) => {
    // Handle the pair up request
    socket.on("joinLobby", (username) => {
        socket.username = username;
        if (waitingSocket) {
            const roomId = Math.random().toString(36).substring(2, 15);
            waitingSocket.join(roomId);
            socket.join(roomId);
            io.to(roomId).emit("paired", {
                player1: waitingSocket.username,
                player2: socket.username,
                roomId: roomId
            });
            waitingSocket = null;
        } else {
            waitingSocket = socket;
            socket.emit("waiting");
        }
    });

    // Handle the start game request (only from host/player1)
    socket.on("startGame", (data) => {
        const room = Array.from(socket.rooms).find(r => r !== socket.id);
        if (room === data.roomId) {
            const mapIndex = data.mapIndex;
            const spawnData = data.spawnData; // Receive spawn positions from player1
            io.to(room).emit("gameStart", { mapIndex, spawnData } );
        }
    });

    // Handle monster position sync from player 1
    socket.on("syncMonsters", (data) => {
        socket.to(data.roomId).emit("syncMonsters", data);
    });

    // Handle player position sync
    socket.on("syncPosition", (data) => {
        socket.to(data.roomId).emit("syncPosition", data);
    });

    // Handle treasure collection sync
    socket.on("collectTreasure", (data) => {
        socket.to(data.roomId).emit("collectTreasure", data);
    });

    // Handle pushblock position sync
    socket.on("syncPushblocks", (data) => {
        socket.to(data.roomId).emit("syncPushblocks", data);
    });

    socket.on("action", (data) => {
        socket.to(data.roomId).emit("action", data);
    });

    socket.on("killMonster", (data) => {
        socket.to(data.roomId).emit("killMonster", data);
    });

    socket.on("updateHP", (data) => {
        socket.to(data.roomId).emit("updateHP", data);
    });

    socket.on("gameOver", (data) => {
        io.to(data.roomId).emit("gameOver", data);
    });
});

httpServer.listen(8000, () => {
    console.log("Game Sever is running at port 8000...");
});
