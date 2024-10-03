const User = require("../models/userModel"); // Assume you have a User model
const { generateToken } = require("../utils/jwtUtils");

const loginUser = async (req, res) => {
  const { email, password } = req.body;

  // Find user by email
  const user = await User.findOne({ email });
  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  // If credentials are correct, generate a JWT
  const token = generateToken(user);

  res.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    token, // Send token to the client
  });
};

module.exports = { loginUser };
