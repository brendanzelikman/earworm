var express = require('express');
var router = express.Router();
var passport = require('passport');
var jwt = require('express-jwt');
var env = require('dotenv').config();

var mongoose = require('mongoose');
var Post = mongoose.model('Post');
var Comment = mongoose.model('Comment');
var User = mongoose.model('User');

var auth = jwt({secret: process.env.KEY, algorithms: ['HS256'], userProperty: 'payload'});

router.param('post', function(req, res, next, id){
  var query = Post.findById(id);

  query.exec(function(err, post){
    if (err) { return next(err); }
    if (!post) { return next(new Error("Can\'t find post!")); }

    req.post = post;
    return next();
  });
});

router.get('/posts', function(req, res, next){
  Post.find(function(err, posts){
    if (err) { return next(err); }
    res.json(posts);
  });
});

router.post('/posts', auth, function(req, res, next){
  var post = new Post(req.body);
  post.author = req.payload.username;

  return post.save(function(err, post){
    if (err) { return next(err); }
    res.json(post);
  });
});

router.get('/posts/:post', function(req, res){
  req.post.populate('comments', function(err, post){
    if (err) {return next(err);}
    res.json(post);
  });
});

router.put('/posts/:post', function(req, res, next){
    var post = req.body[0];
    var newPost = req.body[1];
    Post.updateOne({"_id": post._id}, {
      song: newPost.song,
      caption: newPost.caption
    }, {new: true}, function(err){
    if (err) { return next(err); }
    res.json(post);
  });
});

router.delete('/posts/:post', auth, function(req, res, next){
  Comment.remove({post: req.post}, function(err){
      req.post.remove(function(err) {
          if (err) { return next(err); }
          res.send("success");
        });
  });
});

router.put('/posts/:post/upvote', auth, function(req, res, next){
    req.post.upvote(req.payload.username, function(err, post){
    if (err) return next(err);
    res.json(post);
  });
});

module.exports = router;
