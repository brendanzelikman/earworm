/* jshint esversion: 6 */
var app = angular.module("postService", ['ui.router']);

app.factory('posts', ['$http', 'auth', function($http, auth){
  // Posts
  var o = {
    posts: []
  };
  // HTTP get from a post id
  o.get = function(id){
    return $http.get('/posts/'+id).then(function(res){
      return res.data;
    });
  };
  // HTTP get all posts
  o.getAll = function() {
   return $http.get('/posts').success(function(data) {
      angular.copy(data, o.posts);
    });
  };
  // HTTP put/remove a follow
  o.create = function(post){
    return $http.post('/posts', post, {
      headers: {Authorization: 'Bearer '+auth.getToken()}
    }).success(function(data){
      o.posts.push(data);
    });
  };
  // HTTP delete a post
  o.deletePost = function(post){
    return $http.delete('/posts/'+post._id, {
      headers: {Authorization: 'Bearer '+auth.getToken()}
    }).success(function(){
      var index = o.posts.indexOf(post);
      o.posts.splice(index, 1);
    });
  };
  // HTTP put (edit) a post
  o.editPost = function(post, newPost){
    $http.put('/posts/'+post._id, [post, newPost]);
  };
  // HTTP delete a comment from a post
  o.deleteComment = function(post, comment){
    return $http.delete('/posts/'+post._id+'/comments/'+comment._id, {
      headers: {Authorization: 'Bearer '+auth.getToken()}
    }).success(function(data){
      var index = post.comments.indexOf(comment);
      post.comments.splice(index, 1);
    });
  };
  // HTTP put an upvote on a post
  o.upvotePost = function(post){
    return $http.put('/posts/'+post._id+'/upvote', null, {
      headers: {Authorization: 'Bearer '+auth.getToken()}
    }).success(function(data){
      var username = auth.currentUser().username;
      if (!post.upvotes.includes(username)){
        post.upvotes.push(username);
      } else {
        var index = post.upvotes.indexOf(username);
        post.upvotes.splice(index, 1);
      }
      });
  };
  // HTTP post a comment on a post
  o.addComment = function(id, comment){
    return $http.post('/posts/'+id+'/comments', comment, {
      headers: {Authorization: 'Bearer '+auth.getToken()}
    });
  };
  // HTTP put (edit) a comment
  o.editComment = function(post, comment, newBody){
    $http.put('/posts/'+post._id+'/comments/'+comment._id, [comment, newBody]);
    location.reload();
  };
  // HTTP put/remove an upvote from a comment
  o.upvoteComment = function(post, comment){
    return $http.put('/posts/'+post._id+'/comments/'+comment._id+'/upvote', null, {
      headers: {Authorization: 'Bearer '+auth.getToken()}
    }).success(function(data){
      var username = auth.currentUser().username;
      if (!comment.upvotes.includes(username)){
        comment.upvotes.push(username);
      } else {
        var index = comment.upvotes.indexOf(username);
        comment.upvotes.splice(index, 1);
      }
      });
  };
  return o;
}]);
