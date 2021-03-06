// dotenv is used to access environment vars via process.env.<NAME>
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { User, GymMembership } = require("./database.models.js");
const session = require("express-session");
const cookieParser = require("cookie-parser");

const authRoute = require("./routes/auth");
const gymRoute = require("./routes/gym");

// Load express
const app = express();

// Needed to manage Cross-Origin Resource Sharing

// Tells express to recognise incoming requests as JSON
app.use(express.json());
// Manages CORS headers to prevent errors
app.use(cors());

app.use(cookieParser());

// Adapted from https://www.codementor.io/@mayowa.a/how-to-build-a-simple-session-based-authentication-system-with-nodejs-from-scratch-6vn67mcy3
// sets the settings for the session
// Be aware that if you change expires you will need to update ./routes/auth.js in the login function
// 2 hours * 60 minutes * 60 seconds * 1000 ms
app.use(session({
  key: 'user_sid',
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    expires: 2 * 60 * 60 * 1000
  }
}));

// Initialise the tables
(async() => {
  await User.sync();
  await GymMembership.sync();
})();

// This middleware will check if user's cookie is still saved in browser and user is not set, then automatically log the user out.
// This usually happens when you stop your express server after login, your cookie still remains saved in the browser.
// https://www.codementor.io/@mayowa.a/how-to-build-a-simple-session-based-authentication-system-with-nodejs-from-scratch-6vn67mcy3
app.use((req, res, next) => {
  if (req.cookies.user_sid && !req.session.user) {
    res.clearCookie('user_sid');
  }

  next();
});

app.use("/api/auth", authRoute);

// Middleware to check if the user is logged in
const isLoggedIn = (req, res, next) => {
  if(req.session.user && req.cookies.user_sid) {
    return next();
  }

  res.status(401).json({ message: "Not logged in" });
  return;
};

app.use("/api/gym", isLoggedIn, gymRoute);

// Listen for requests on the port specified in the .env file
app.listen(process.env.EXPRESS_PORT, () => console.log(`Server started on ${process.env.EXPRESS_PORT}`));
