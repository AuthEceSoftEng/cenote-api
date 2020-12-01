const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema({
  session: String,
  session_id: String,
  expire: Date,
});

const Session = mongoose.model("Session", sessionSchema);

module.exports = Session;
