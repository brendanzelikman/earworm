var express = require('express');
var router = express.Router();
var jwt = require('express-jwt');
var env = require('dotenv').config();

var mongoose = require('mongoose');
var Post = mongoose.model('Post');
var Comment = mongoose.model('Comment');
var User = mongoose.model('User');

var auth = jwt({secret: process.env.KEY, algorithms: ['HS256'], userProperty: 'payload'});

router.param('user', function(req, res, next, id){
  var query = User.findById(id);

  query.exec(function(err, user){
    if (err) { return next(err); }
    if (!user) { return next(new Error("Can\'t find user!")); }

    req.user = user;
    return next();
  });
});

router.post('/users', auth, function(req, res, next){
  var user = new User(req.body);

  return user.save(function(err, user){
    if (err) return next(err);
    res.json(user);
  });
});

router.put('/users/:username', function(req, res, next){
    var user = req.body[0];
    var newUser = req.body[1];
    User.updateOne({"username": user.username}, {
      image: newUser.image,
      bio: newUser.bio,
      favSong: newUser.favSong,
      favArtist: newUser.favArtist
    }, {new: true}, function(err){
    if (err) { return next(err); }
    res.json(user);
  });
});

router.get('/users/:username', function(req, res, next){
  User.findOne({username: req.params.username}, function(err, user){
    if (err) { return next(err); }
    res.json(user);
  });
});

router.delete('/users/:username', auth, function(req, res, next){
  var username = req.payload.username;
  Comment.remove({author: username}, function(err){
    Post.remove({author: username}, function(err){
      User.remove({username: username}, function(err){
        if (err) return next(err);
        res.send("success");
      });
    });
  });
});

router.get('/users/:user/follow', function(req, res, next){
  var reqUser = req.body[0];
  var reqFollow = req.body[1];
  User.findOne({'username': reqUser.username}).then(function(user){
    if (!user) { return res.sendStatus(401); }
    return user.isFollowing(reqFollow.username);
  }).catch(next);
});

router.put('/users/:user/follow', auth, function(req, res, next){
  User.findOne({'username': req.payload.username}).then(function(user){
    if (!user) { return res.sendStatus(401); }
    user.follow(req.user[0], function(err, user){
      if (err) return next(err);
      res.json(user);
    });
  });
});

module.exports = router;
