var express = require('express');
var router = express.Router();
var passport = require('passport');
var jwt = require('express-jwt');
var env = require('dotenv').config();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

var mongoose = require('mongoose');
var Post = mongoose.model('Post');
var Comment = mongoose.model('Comment');
var User = mongoose.model('User');

var auth = jwt({secret: process.env.KEY, algorithms: ['HS256'], userProperty: 'payload'});

// Get all posts
router.get('/posts', function(req, res, next){
  Post.find(function(err, posts){
    if (err) { return next(err); }
    res.json(posts);
  });
});

// Preload post objects on routes with ':post'
router.param('post', function(req, res, next, id){
  var query = Post.findById(id);

  query.exec(function(err, post){
    if (err) { return next(err); }
    if (!post) { return next(new Error("Can\'t find post!")); }

    req.post = post;
    return next();
  });
});

// Preload comment objects on routes with ':comment'
router.param('comment', function(req, res, next, id){
  var query = Comment.findById(id);

  query.exec(function(err, comment){
    if (err) { return next(err); }
    if (!comment) { return next(new Error("Can\'t find comment!")); }

    req.comment = comment;
    return next();
  });
});

// Create post
router.post('/posts', auth, function(req, res, next){
  var post = new Post(req.body);
  post.author = req.payload.username;

  return post.save(function(err, post){
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

// Upvote a post
router.put('/posts/:post/upvote', auth, function(req, res, next){
    req.post.upvote(req.payload.username, function(err, post){
    if (err) { return next(err); }
    res.json(post);
  });
});

// Post a comment
router.post('/posts/:post/comments', auth, function(req, res, next){
  var comment = new Comment(req.body);
  comment.post = req.post._id;
  comment.author = req.payload.username;

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

// Upvote a comment
router.put('/posts/:post/comments/:comment/upvote', auth, function(req, res, next){
  req.comment.upvote(req.payload.username, function(err, comment){
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
    return res.json({token: user.generateJWT()});
  });
});

router.post('/login', function(req, res, next){
  if (!req.body.username || !req.body.password){
    return res.status(400).json({message: 'Please fill out all fields'});
  }

  passport.authenticate('local', function(err, user, info){
    if (err) { return next(err); }

    if (user){
      return res.json({token: user.generateJWT()});
    } else {
      return res.status(401).json(info);
    }
  })(req, res, next);
});

module.editPost =

module.exports = router;
