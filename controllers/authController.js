const usersDB = {
  users: require("../model/users.json"),
  setUsers: function (data) {
    this.users = data;
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

  // search user based on 'email'
  const foundUser = usersDB.users.find((person) => person.email === email);
  if (!foundUser) return res.sendStatus(401); // Unauthorized

  // ارزیابی رمز عبور
  const match = await bcrypt.compare(password, foundUser.password);
  console.log("User found:", foundUser);

  if (match) {
    // create JWT roken
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
    // create refreshToken
    const refreshToken = jwt.sign(
      {
        email: foundUser.email,
        username: foundUser.username,
        role: foundUser.role,
      },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "1d" }
    );
    const otherUsers = usersDB.users.filter(
      (person) => person.email !== foundUser.email
    );
    const currentUser = { ...foundUser, refreshToken };
    usersDB.setUsers([...otherUsers, currentUser]);
    await fsPromises.writeFile(
      path.join(__dirname, "..", "model", "users.json"),
      JSON.stringify(usersDB.users)
    );

    res.cookie("jwt", refreshToken, {
      httpOnly: true,
      sameSite: "None",
      secure: true,
      maxAge: 24 * 60 * 60 * 1000,
    });
    console.log(
      "Sending access token that include role and userName to client"
    );
    // send accessToken to front-end
    res.json({
      accessToken,
    });
  } else {
    res.sendStatus(401);
  }
};

module.exports = { handleLogin };
