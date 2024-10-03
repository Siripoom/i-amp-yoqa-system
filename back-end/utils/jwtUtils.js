const jwt = require("jsonwebtoken");

// Generate a JWT
const generateToken = (user) => {
  return jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "30d", // Token will expire in 30 days
  });
};

// Verify the JWT
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error("Invalid Token");
  }
};

module.exports = { generateToken, verifyToken };
