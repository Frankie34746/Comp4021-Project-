const express = require("express");

const bcrypt = require("bcryptjs");       // bcryptjs is used instead of bcrypt
const fs = require("fs");

// Create the Express app
const app = express();

// Use the 'public' folder to serve static files
app.use(express.static("public"));

// Use the json middleware to parse JSON data
app.use(express.json());

// Handle the /register endpoint
app.post("/register", (req, res) => {
    // Get the JSON data from the body
    const { username } = req.body;

    //
    // D. Reading the users.json file
    //
    const users = JSON.parse(fs.readFileSync("./data/users.json"));

    //
    // G. Adding the new user account
    //
    users[username] = {username};

    //
    // H. Saving the users.json file
    //
    fs.writeFileSync("./data/users.json", JSON.stringify(users, null, " "));

    //
    // I. Sending a success response to the browser
    //
    res.json({ status: "success" })
});

app.listen(8000, () => {
    console.log("Game Sever is running...");
});
