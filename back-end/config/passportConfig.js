// config/passportConfig.js
const passportLine = require("passport-line");
const passport = require("passport");
const lineAuthService = require("../middlewares/lineAuthService.js");

passport.use(
  new passportLine.Strategy(
    {
      channelID: process.env.LINE_CHANNEL_ID, // LINE Channel ID
      channelSecret: process.env.LINE_CHANNEL_SECRET, // LINE Channel Secret
      callbackURL: "http://localhost:5000/auth/line/callback", // LINE Callback URL
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const user = await lineAuthService.findOrCreateUser(profile);
        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});
