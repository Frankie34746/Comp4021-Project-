const express = require("express");
const fs = require("fs");

// Create the Express app
const app = express();

// Use the 'public' folder to serve static files
app.use(express.static("public"));

// Use the json middleware to parse JSON data
app.use(express.json());

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
    socket.on("startGame", (roomId) => {
        const room = Array.from(socket.rooms).find(r => r !== socket.id);
        if (room === roomId) {
            io.to(room).emit("gameStart");
        }
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
