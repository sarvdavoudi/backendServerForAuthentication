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
    const { email, password } = req.body; // تغییر از user به email
    console.log("Received data:", req.body); // اینجا اضافه کنید
    if (!email || !password)
      return res
        .status(400)
        .json({ message: "Email and password are required." });
  
    // جستجوی کاربر بر اساس ایمیل
    const foundUser = usersDB.users.find((person) => person.email === email);
    if (!foundUser) return res.sendStatus(401); // Unauthorized
  
    // ارزیابی رمز عبور
    const match = await bcrypt.compare(password, foundUser.password);
    console.log("User found:", foundUser); // اینجا اضافه کنید
  
    if (match) {
      // ایجاد توکن های JWT
      const accessToken = jwt.sign(
        { email: foundUser.email },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "30s" }
      );
      console.log("Access token generated:", accessToken); // اینجا اضافه کنید
      const refreshToken = jwt.sign(
        { email: foundUser.email },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: "1d" }
      );
      // ذخیره refreshToken با کاربر فعلی
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
      console.log("Sending access token to client");
      res.json({ accessToken });
    } else {
      res.sendStatus(401);
    }
  };
  
  module.exports = { handleLogin };
  