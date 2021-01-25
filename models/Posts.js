var mongoose = require('mongoose');

var PostSchema = new mongoose.Schema({
  song: {title: String, artist: String},
  caption: String,
  author: {type: mongoose.Schema.Types.ObjectID, ref: 'User'},
  upvotes: [{type: mongoose.Schema.Types.ObjectID, ref: 'User'}],
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment'}]
}, {timestamps: true});

PostSchema.methods.upvote = function(id, cb){
  if (!this.upvotes.includes(id)){
    this.upvotes.push(id);
  } else {
    this.upvotes.remove(id);
  }
  this.save(cb);
};

mongoose.model('Post', PostSchema);
