const mongoose = require('mongoose'),
  userSchema = new mongoose.Schema({
    firstName: String,
    lastName: String,
    email: String
  }),
  User = mongoose.model('User', userSchema);

module.exports = User;
