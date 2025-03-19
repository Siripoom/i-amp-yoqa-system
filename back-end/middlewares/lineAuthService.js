// services/lineAuthService.js
const User = require("../models/user");

const lineAuthService = {
  async findOrCreateUser(profile) {
    // Check if user already exists
    let user = await User.findOne({ lineId: profile.id });
    if (!user) {
      // Create a new user if not found
      user = new User({
        lineId: profile.id,
        username: profile.displayName,
        email: `${profile.id}@line.com`, // You can assign a default email
        first_name: profile.displayName, // Adjust as per your schema
        last_name: "", // Adjust if you can extract from profile
        pictureUrl: profile.pictureUrl, // Add more fields as necessary
      });
      await user.save();
    }
    return user;
  },
};

module.exports = lineAuthService;
