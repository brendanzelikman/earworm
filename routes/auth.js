var express = require('express');
var router = express.Router();
var passport = require('passport');
var jwt = require('express-jwt');
var env = require('dotenv').config();

var mongoose = require('mongoose');
var User = mongoose.model('User');

var auth = jwt({secret: process.env.KEY, algorithms: ['HS256'], userProperty: 'payload'});


router.post('/register', function(req, res, next){
  if (!req.body.username || !req.body.password){
    return res.status(400).json({message: 'Please fill out all fields'});
  }

  var user = new User();

  user.username = req.body.username;
  user.setPassword(req.body.password);

  user.save(function(err){
    if (err) {
      if (err.code === 11000) next(new Error(11000));
      return next(err);
    }
    user.token = user.generateJWT();
    return res.json({user: user.toAuthJSON()});
  });
});

router.post('/login', function(req, res, next){
  if (!req.body.username || !req.body.password){
    return res.status(400).json({message: 'Please fill out all fields'});
  }

  passport.authenticate('local', function(err, user, info){
    if (err) { return next(err); }

    if (user){
      user.token = user.generateJWT();
      return res.json({user: user.toAuthJSON()});
    } else {
      return res.status(401).json(info);
    }
  })(req, res, next);
});

module.exports = router;
