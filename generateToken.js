const jwt = require("jsonwebtoken");

function generateAccessToken(email) {
  return jwt.sign({ email }, process.env.TOKEN_SECRET, { expiresIn: "30d" });
}
module.exports = { generateAccessToken };
