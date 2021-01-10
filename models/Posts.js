var mongoose = require('mongoose');

var PostSchema = new mongoose.Schema({
  song: {title: String, artist: String},
  caption: String,
  author: String,
  upvotes: {type: Array, default: []},
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment'}]
}, {timestamps: true});

PostSchema.methods.upvote = function(name, cb){
  if (!this.upvotes.includes(name)){
    this.upvotes.push(name);
  } else {
    this.upvotes.remove(name);
  }
  this.save(cb);
};

mongoose.model('Post', PostSchema);
