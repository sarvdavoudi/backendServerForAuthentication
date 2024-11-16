const fs = require("fs");

const usersDB = {
  getUsers: function () {
    return JSON.parse(
      fs.readFileSync(path.join(__dirname, "..", "model", "users.json"))
    );
  },
  setUsers: function (data) {
    fs.writeFileSync(
      path.join(__dirname, "..", "model", "users.json"),
      JSON.stringify(data)
    );
  },
};

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const fsPromises = require("fs").promises;
const path = require("path");

const handleLogin = async (req, res) => {
  const { email, password } = req.body;
  console.log("Received data:", req.body);
  if (!email || !password)
    return res
      .status(400)
      .json({ message: "Email and password are required." });

  // Reload users from the file
  const users = usersDB.getUsers();
  const foundUser = users.find((person) => person.email === email);
  if (!foundUser) return res.sendStatus(401); // Unauthorized

  // Check the password
  const match = await bcrypt.compare(password, foundUser.password);
  console.log("User found:", foundUser);

  if (match) {
    // Create JWT token
    const accessToken = jwt.sign(
      {
        email: foundUser.email,
        role: foundUser.role,
        username: foundUser.username,
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "30s" }
    );
    console.log("Access token generated:", accessToken);

    // Create refreshToken
    const refreshToken = jwt.sign(
      {
        email: foundUser.email,
        username: foundUser.username,
        role: foundUser.role,
      },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "1d" }
    );
    const otherUsers = users.filter((person) => person.email !== foundUser.email);
    const currentUser = { ...foundUser, refreshToken };
    usersDB.setUsers([...otherUsers, currentUser]);

    res.cookie("jwt", refreshToken, {
      httpOnly: true,
      sameSite: "None",
      secure: true,
      maxAge: 24 * 60 * 60 * 1000,
    });
    console.log(
      "Sending access token that includes role and userName to client"
    );
    res.json({
      accessToken,
    });
  } else {
    res.sendStatus(401);
  }
};

module.exports = { handleLogin };
