var mongoose = require('mongoose');
var crypto = require('crypto');
var jwt = require('jsonwebtoken');
var env = require('dotenv').config();

var UserSchema = new mongoose.Schema({
  username: {type: String, unique: true},
  image: {type: String, default:"images/defaultuser.png"},
  bio: String,
  favSong: String,
  favArtist: String,
  hash: String,
  salt: String
});

UserSchema.methods.setPassword = function(password){
  this.salt = crypto.randomBytes(16).toString('hex');
  this.hash = crypto.pbkdf2Sync(password, this.salt, 1000, 64, 'sha512').toString('hex');
};

UserSchema.methods.validPassword = function(password){
  var hash = crypto.pbkdf2Sync(password, this.salt, 1000, 64, 'sha512').toString('hex');
  return this.hash === hash;
};

UserSchema.methods.generateJWT = function(){
  var today = new Date();
  var exp = new Date(today);
  exp.setDate(today.getDate() + 7);

  return jwt.sign({
    _id: this._id,
    username: this.username,
    exp: parseInt(exp.getTime() / 1000),
  }, process.env.KEY);
};

mongoose.model('User', UserSchema);
