/* jshint esversion: 6 */
var app = angular.module("mainController", ['ui.router']);

app.controller('MainCtrl', [
  '$scope',
  'posts',
  'users',
  'auth',
  function($scope, posts, users, auth){
    // $scope initialized variables
    $scope.posts = posts.posts;
    $scope.users = users.users;
    $scope.isLoggedIn = auth.isLoggedIn;
    $scope.user = auth.currentUser();
    // Obtain sort from localStorage || "new" and initialize search to empty
    $scope.sortedBy = localStorage.getItem('postSortedBy') || "-createdAt";
    $scope.postSearch = function(post){ return true; };
    // Set "sort by" to last selected option
    if (localStorage.getItem('postSelectedSort')) {
      $("#sortPost option").eq(localStorage.getItem('postSelectedSort')).prop('selected', true);
    }
    // Change ordering of posts based on sort selection
    $("#sortPost").on('change', function() {
      switch($(this).val()){
        case 'new': $scope.sortedBy = "-createdAt"; break;
        case 'upvotes': $scope.sortedBy = "-upvotes.length"; break;
        case 'comments': $scope.sortedBy = "-comments.length"; break;
      }
      localStorage.setItem('postSelectedSort', $('option:selected', this).index());
      localStorage.setItem('postSortedBy', $scope.sortedBy);
      $scope.$apply();
    });
    // Filter out posts that don't match the search query
    $("#postSearch").on('keyup', function() {
      var val = $(this).val().toLowerCase();
      $scope.postSearch = function(post){
        var titleInc = post.song.title.toLowerCase().includes(val);
        var artistInc = post.song.artist.toLowerCase().includes(val);
        return titleInc || artistInc;
      };
      $scope.$apply();
    });
    // Upvote a post
    $scope.upvotePost = function(post){
      posts.upvotePost(post);
    };
    // Return if user upvoted post
    $scope.upvotedPost = function(post){
      if ($scope.isLoggedIn()) return post.upvotes.includes($scope.user.username);
    };
    // Return if user authored post
    $scope.authoredPost = function(post){
      if ($scope.isLoggedIn()) return post.author === $scope.user.username;
    };
    // Create a post using a bootbox modal confirm
    $scope.addPost = function(){
      bootbox.confirm({
        message:
          `<span style='margin-top: 10px; text-align: center;'>
            <h2><b class='bold'>` + $scope.user.username + `</b> is listening to...</h2>
          </span>
          <form style="margin-top: 30px;">
            <div class="form-group" style="float: left; width: 49%">
              <input id="title" type="text" placeholder="Title"
              class="form-control">
            </div>
            <div class="form-group" style="float: left; margin-left: 2%; width: 49%">
              <input id="artist" type="text" placeholder="Artist"
              class="form-control">
            </div>
            <div class="form-group">
              <input id="caption" style="height: 50px;" type="text"
              placeholder="Caption" class="form-control">
            </div>
          </form>`,
        buttons: {
          cancel: {
            label: 'Cancel'
          },
          confirm: {
            label: 'Post'
          }
        },
        callback: function(result) {
          if (result){
            var title = document.getElementById('title').value;
            var artist = document.getElementById('artist').value;
            if (title && artist) {
              posts.create({
                song: {
                  title: title,
                  artist: artist
                },
                caption: document.getElementById('caption').value
              });
            }
          }
        }
    });
    };
    // Edit a post using bootbox modal confirm
    $scope.editPost = function(post){
      bootbox.confirm({
        message:
          `<span style='margin-top: 10px; text-align: center;'>
            <h2><b class='bold'>` + $scope.user.username + `</b> is listening to...</h2></span>
          <form style="margin-top: 30px;">
            <div class="form-group" style="float: left; width: 49%">
              <input id="title" type="text" value="`+post.song.title+
              `" placeholder="Title" class="form-control" required>
            </div>
            <div class="form-group" style="float: left; margin-left: 2%; width: 49%">
              <input id="artist" type="text" value="`+post.song.artist+
              `" placeholder="Artist" class="form-control" required>
            </div>
            <div class="form-group">
              <input id="caption" style="height: 50px;" type="text" value="`+
              post.caption+`" placeholder="Caption" class="form-control">
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
            var newPost = {
              song: {
                title: document.getElementById('title').value,
                artist: document.getElementById('artist').value
              },
              caption: document.getElementById('caption').value
            };
            post.song = newPost.song;
            post.caption = newPost.caption;
            posts.editPost(post, newPost);
          }
        }
      });
    };
    // Delete a post with a modal confirm
    $scope.deletePost = function(post){
      bootbox.confirm({
        title:
          `<div style='margin-top: 20px;' class='icon-box'>
             <i class='material-icons'>&#xE5CD;</i>
           </div>
           <h2 style='text-align: center'><b class='bold'>Are you sure?</b></h2>`,
        message:
          `<h4 style='text-align: center'>
             Do you really want to delete this post? This cannot be undone.
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
        onEscape: true,
        backdrop: true,
        callback: function(result){
          if (result) posts.deletePost(post);
        }
      });
    };
    // Return time since date for post timestamps
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
}]);
