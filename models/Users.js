var mongoose = require('mongoose');
var crypto = require('crypto');
var jwt = require('jsonwebtoken');
var env = require('dotenv').config();
var secret = process.env.KEY;

var UserSchema = new mongoose.Schema({
  username: {type: String, unique: true},
  image: {type: String, default : "images/defaultuser.png"},
  bio: {type: String, default : "I love EarWorm!"},
  favSong: String,
  favArtist: String,
  following: {type: Array, default: []},
  hash: String,
  salt: String
});

UserSchema.methods.follow = function(name, cb){
  if(!this.following.includes(name)){
    this.following.push(name);
  } else {
    this.following.remove(name);
  }
  this.save(cb);
};

UserSchema.methods.isFollowing = function(name){
  return this.following.some(function(followId){
    return followId.toString() === name.toString();
  });
};

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
  }, secret);
};

UserSchema.methods.toAuthJSON = function(){
  return {
    username: this.username,
    image: this.image,
    bio: this.bio,
    favSong: this.favSong,
    favArtist: this.favArtist,
    following: this.following,
    token: this.generateJWT(),
  };
};

mongoose.model('User', UserSchema);
