const usersDB = {
  users: require("../model/users.json"),
  setUsers: function (data) {
    this.users = data;
  },
};
const fsPromises = require("fs").promises;
const path = require("path");
const bcrypt = require("bcrypt");

const handleNewUser = async (req, res) => {
  const { username, password, email, birthdate, gender} = req.body;
  if (!username || !password)
    return res
      .status(400)
      .json({ message: "Username and password are required." });

  const duplicate = usersDB.users.find(
    (person) => person.username === username
  );
  if (duplicate) return res.sendStatus(409); // Conflict

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user object with all fields
    const newUser = {
        username,
        password: hashedPassword,
        email,
        birthdate: birthdate || null,
        gender: gender || null,
        role:"base-role" //add default role from back-end
      };
      

    usersDB.setUsers([...usersDB.users, newUser]);
    await fsPromises.writeFile(
      path.join(__dirname, "..", "model", "users.json"),
      JSON.stringify(usersDB.users, null, 2) // Pretty print for readability
    );

    console.log(usersDB.users);
    res.status(201).json({ success: `New user ${username} created!` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { handleNewUser };
