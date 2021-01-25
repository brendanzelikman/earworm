var mongoose = require('mongoose');

var CommentSchema = new mongoose.Schema({
  body: String,
  author: {type: mongoose.Schema.Types.ObjectID, ref: 'User'},
  upvotes: {type: Array, default: []},
  post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post'}
}, {timestamps: true});

CommentSchema.methods.upvote = function(id, cb){
  if (!this.upvotes.includes(id)){
    this.upvotes.push(id);
  } else {
    this.upvotes.remove(id);
  }
  this.save(cb);
};

mongoose.model('Comment', CommentSchema);
