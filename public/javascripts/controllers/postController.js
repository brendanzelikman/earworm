/* jshint esversion: 6 */
var app = angular.module("postController", ['ui.router']);

app.controller('PostsCtrl', [
  '$scope',
  'posts',
  'post',
  'auth',
  function($scope, posts, post, auth){
    // $scope initialized variables
    $scope.post = post;
    $scope.isLoggedIn = auth.isLoggedIn;
    $scope.user = auth.currentUser();
    // Obtain sort from localStorage || "new"
    $scope.sortedBy = localStorage.getItem('commentSortedBy') || "-createdAt";
    // Set "sort by" to last selected option
    if (localStorage.getItem('commentSelectedSort')) {
      $("#sortComment option").eq(localStorage.getItem('commentSelectedSort')).prop('selected', true);
    }
    // Change ordering of comments based on sort selection
    $("#sortComment").on('change', function() {
      switch($(this).val()){
        case 'new': $scope.sortedBy = "-createdAt"; break;
        case 'old': $scope.sortedBy = "createdAt"; break;
        case 'upvotes': $scope.sortedBy = "-upvotes.length"; break;
      }
      localStorage.setItem('commentSelectedSort', $('option:selected', this).index());
      localStorage.setItem('commentSortedBy', $scope.sortedBy);
      $scope.$apply();
    });
    // Create a comment
    $scope.addComment = function(){
      if ($scope.body === '') { return; }
      posts.addComment(post._id, {
        body: $scope.body,
        author: 'user',
      }).success(function(comment){
        $scope.post.comments.push(comment);
      });
      $scope.body = '';
    };
    // Delete a comment with bootbox modal confirm
    $scope.deleteComment = function(comment){
      bootbox.confirm({
        title:
          `<div style='margin-top: 20px;' class='icon-box'>
             <i class='material-icons'>&#xE5CD;</i>
           </div>
           <h2 style='text-align: center'><b>Are you sure?</b></h2>`,
        message:
          `<h4 style='text-align: center'>
             Do you really want to delete this comment? This cannot be undone.
           </h4>`,
        buttons: {
          cancel: {
            className: 'btn-lg btn-light',
            label: 'Cancel'
          },
          confirm: {
            className: 'btn-lg btn-danger',
            label: 'Delete'
          }
        },
        centerVertical: true,
        onEscape: true,
        backdrop: true,
        callback: function(result){
          if (result) posts.deleteComment(post, comment);
        }
      });
    };
    // Edit a comment of a post with a bootbox modal confirm
    $scope.editComment = function(post, comment){
      bootbox.confirm({
        message:
          `<span style='margin-top: 10px; text-align: center;'>
            <h2><b>` + $scope.user.username + ` wants to say...</h2>
          </span>
          <form style="margin-top: 30px;">
            <div class="form-group">
              <input id="body" style="height: 50px;" type="text"
              value="`+comment.body+`" placeholder="Body" class="form-control" required>
            </div>
          </form>`,
        buttons: {
          cancel: {
            label: 'Cancel'
          },
          confirm: {
            label: 'Edit'
          }
        },
        callback: function(result) {
          if (result){
            posts.editComment(post, comment, document.getElementById('body').value);
          }
        }
      });
    };
    // Upvote the post of the page
    $scope.upvotePost = function(post){
      posts.upvotePost(post);
    };
    // Upvote a comment
    $scope.upvoteComment = function(comment){
      posts.upvoteComment(post, comment);
    };
    // Return if user upvoted the post
    $scope.upvotedPost = function(post){
      if ($scope.isLoggedIn()) return post.upvotes.includes($scope.user.username);
    };
    // Return if user upvoted a comment
    $scope.upvotedComment = function(comment){
      if ($scope.isLoggedIn()) return comment.upvotes.includes($scope.user.username);
    };
    // Return if user authored a comment
    $scope.authoredComment = function(comment){
      if ($scope.isLoggedIn()) return comment.author === $scope.user.username;
    };
    // Return time since date for post/comment timestamps
    $scope.timeSince = function(date) {
      var seconds = Math.floor((new Date() - Date.parse(date)) / 1000);
      var interval = seconds / 31536000;
      if (interval > 1) return Math.floor(interval) + "y";
      interval = seconds / 2592000;
      if (interval > 1) return Math.floor(interval) + "mo";
      interval = seconds / 86400;
      if (interval > 1) return Math.floor(interval) + "d";
      interval = seconds / 3600;
      if (interval > 1) return Math.floor(interval) + "h";
      interval = seconds / 60;
      if (interval > 1) return Math.floor(interval) + "m";
      return Math.floor(seconds) + "s";
    };
}])
