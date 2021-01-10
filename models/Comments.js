var mongoose = require('mongoose');

var CommentSchema = new mongoose.Schema({
  body: String,
  author: String,
  upvotes: {type: Array, default: []},
  post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post'}
}, {timestamps: true});

CommentSchema.methods.upvote = function(name, cb){
  if (!this.upvotes.includes(name)){
    this.upvotes.push(name);
  } else {
    this.upvotes.remove(name);
  }
  this.save(cb);
};

mongoose.model('Comment', CommentSchema);
