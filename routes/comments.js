var express = require('express');
var router = express.Router();
var jwt = require('express-jwt');
var env = require('dotenv').config();

var mongoose = require('mongoose');
var Post = mongoose.model('Post');
var Comment = mongoose.model('Comment');

var auth = jwt({secret: process.env.KEY, algorithms: ['HS256'], userProperty: 'payload'});

router.param('post', function(req, res, next, id){
  Post.findById(id).exec(function(err, post){
    if (err) { return next(err); }
    if (!post) { return next(new Error("Can\'t find post!")); }

    req.post = post;
    return next();
  });
});

router.param('comment', function(req, res, next, id){
  var query = Comment.findById(id);

  query.exec(function(err, comment){
    if (err) { return next(err); }
    if (!comment) { return next(new Error("Can\'t find comment!")); }

    req.comment = comment;
    return next();
  });
});

router.post('/posts/:post/comments', auth, function(req, res, next){
  var comment = new Comment(req.body);
  comment.post = req.post._id;
  comment.author = req.payload._id;

  comment.save(function(err, comment){
    if (err) { return next(err); }

    req.post.comments.push(comment._id);
    req.post.save(function(err, post){
      if (err) { return next(err); }
      res.json(comment);
    });
  });
});

router.put('/posts/:post/comments/:comment', function(req, res, next){
    var comment = req.body[0];
    var newBody = req.body[1];
    Comment.updateOne({"_id": comment._id}, {
      body: newBody
    }, {new: true}, function(err){
      if (err) { return next(err); }
      res.json(comment);
    });
});

router.delete('/posts/:post/comments/:comment', auth, function(req, res, next){
  var index = req.post.comments.indexOf(req.comment._id);
  req.post.comments.splice(index, 1);
  req.post.save(function(err, post) {
    if (err) { return next(err); }
    req.comment.remove(function(err) {
      if (err) { return next(err); }
      res.send("success");
    });
  });
});

router.put('/posts/:post/comments/:comment/upvote', auth, function(req, res, next){
  req.comment.upvote(req.payload._id, function(err, comment){
    if (err) { return next(err); }
    res.json(comment);
  });
});

module.exports = router;
