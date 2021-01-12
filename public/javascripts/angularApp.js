 /*jshint esversion: 6 */
var app = angular.module('EarWorm', ['ui.router'])

.config([
  '$stateProvider',
  '$urlRouterProvider',
  function($stateProvider, $urlRouterProvider){
    $stateProvider
      // Home page
      .state('home', {
        url: '/home',
        templateUrl: '/home.html',
        controller: 'MainCtrl',
        resolve: {
          postPromise: ['posts', function(posts){
            return posts.getAll();
          }]
        }
      })
      // Profile page
      .state('users', {
        url: '/users/{username}',
        templateUrl: '/users.html',
        controller: 'UserCtrl',
        resolve: {
          user: ['$stateParams', 'users', function($stateParams, users){
            return users.get($stateParams.username);
          }]
        }
      })
      // Post page
      .state('posts', {
        url: '/posts/{id}',
        templateUrl: '/posts.html',
        controller: 'PostsCtrl',
        resolve: {
          post: ['$stateParams', 'posts', function($stateParams, posts){
            return posts.get($stateParams.id);
          }]
        },
      })
      // Login page
      .state('login', {
        url: '/login',
        templateUrl: '/login.html',
        controller: 'AuthCtrl',
        onEnter: ['$state', 'auth', function($state, auth){
          if (auth.isLoggedIn()){
            $state.go('home');
          }
        }]
      })
      // Register page
      .state('register', {
        url: '/register',
        templateUrl: '/register.html',
        controller: 'AuthCtrl',
        onEnter: ['$state', 'auth', function($state, auth){
          if (auth.isLoggedIn()){
            $state.go('home');
          }
        }]
    });
    // Otherwise, go to home page
    $urlRouterProvider.otherwise('home');
}])
// User service
.factory('users', ['$http', 'auth', function($http, auth){
  // Users
  var o = {
    users: []
  };
  // HTTP get from a username
  o.get = function(username){
    return $http.get('/users/'+username).then(function(res){
      return res.data;
    });
  };
  // HTTP get all users
  o.getAll = function() {
   return $http.get('/users').success(function(data) {
      angular.copy(data, o.users);
    });
  };
  // HTTP post a user
  o.create = function(user){
    return $http.post('/users', user, {
      headers: {Authorization: 'Bearer '+auth.getToken()}
    }).success(function(data){
      o.users.push(data);
    });
  };
  // HTTP put (edit) a user
  o.editUser = function(user, newUser){
    $http.put('/users/'+user._id, [user, newUser]);
  };
  // HTTP put/remove a follow
  o.follow = function(user, follow){
    return $http.put('/users/'+follow.username+"/follow", null, {
      headers: {Authorization: 'Bearer '+auth.getToken()}
    }).success(function(data){
      if (!user.following.includes(follow.username)){
        user.following.push(follow.username);
        follow.followers.push(user.username);
      } else {
        var index = user.following.indexOf(follow.username);
        user.following.splice(index, 1);
        index = follow.followers.indexOf(user.username);
        follow.followers.splice(index, 1);
      }
    });
  };
  return o;
}])
// Post service
.factory('posts', ['$http', 'auth', function($http, auth){
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
}])
// Auth service
.factory('auth', ['$http', '$window', '$rootScope', function($http, $window, $rootScope){
  var auth = {};
    // Create local storage for auth credentials
    auth.saveToken = function(token){
      $window.localStorage['earworm-token'] = token;
    };
    // Get local storage of auth credentials
    auth.getToken = function(){
      return $window.localStorage['earworm-token'];
    };
    // Return if auth is logged in
    auth.isLoggedIn = function(){
      var token = auth.getToken();
      if (token){
        var payload = JSON.parse($window.atob(token.split('.')[1]));
        return payload.exp > Date.now() / 1000;
      } else {
        return false;
      }
    };
    // Get auth payload (username only)
    auth.currentUser = function(){
      if (auth.isLoggedIn()){
        var token = auth.getToken();
        var payload = JSON.parse($window.atob(token.split('.')[1]));
        return payload;
      }
    };
    // Register a user
    auth.register = function(user){
      return $http.post('/register', user).success(function(data){
        auth.saveToken(data.user.token);
        $window.location.reload();
      }).catch((err) => {
        if (err.data.contains("E11000")){
          bootbox.alert({
            message: '<h2 style="text-align: center"><b>Username already taken!</b></h2>',
            backdrop: true
        });
        }
      });
    };
    // Log in a user
    auth.logIn = function(user){
      return $http.post('/login', user).success(function(data){
        auth.saveToken(data.user.token);
      });
    };
    // Log out a user
    auth.logOut = function(){
      bootbox.confirm({
        message: "<h2 style='text-align: center'><b>Are you sure?</b></h2>",
        buttons: {
          cancel: {
            className: 'btn-lg btn-light',
            label: 'Cancel'
          },
          confirm: {
            className: 'btn-lg btn-success',
            label: 'Log Out'
          }
        },
        centerVertical: true,
        onEscape: true,
        backdrop: true,
        callback: function(result){
          if (result) {
            $window.localStorage.removeItem('earworm-token');
            $window.location.reload();
          }
        }
      });
    };
  return auth;
}])
// Home page controller
.controller('MainCtrl', [
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
            <h2><b>` + $scope.user.username + `/b> is listening to...</h2>
          </span>
          <form style="margin-top: 30px;">
            <div class="form-group" style="float: left; width: 49%">
              <input id="title" type="text" placeholder="Title"
              class="form-control" required>
            </div>
            <div class="form-group" style="float: left; margin-left: 2%; width: 49%">
              <input id="artist" type="text" placeholder="Artist"
              class="form-control" required>
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
            posts.create({
              song: {
                title: document.getElementById('title').value,
                artist: document.getElementById('artist').value
              },
              caption: document.getElementById('caption').value
            });
          }
        }
    });
    };
    // Edit a post using bootbox modal confirm
    $scope.editPost = function(post){
      bootbox.confirm({
        message:
          `<span style='margin-top: 10px; text-align: center;'>
            <h2><b>` + $scope.user.username + `</b> is listening to...</h2></span>
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
           <h2 style='text-align: center'><b>Are you sure?</b></h2>`,
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
        centerVertical: true,
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
}])
// Controller for profile page
.controller('UserCtrl', [
  '$scope',
  'users',
  'user',
  'auth',
  function($scope, users, user, auth){
    // Initialized scope variables
    $scope.profile = user;
    $scope.editing = false;
    $scope.isUser = function(){};
    $scope.isLoggedIn = auth.isLoggedIn;
    // Show following list of profile
    $scope.showFollowing = function(){
      var following = $scope.profile.following;
      var followScript =
        `<script>
          function chase(){
            bootbox.hideAll();
            window.location.href = '#/users/"+user+"'
          }
        </script>`;
      var followingList;
      // For each following, add a clickable link to their profile page
      for (var i = 0; i < following.length; i++){
        var user = following[i];
        followingList +=
          `<h3 style='text-align: center'>
            <a style='cursor:pointer' onclick='chase()'>"+user+"</a>
          </h3>`;
      }
      // Bootbox modal alert following list
      bootbox.alert({
        title:
          "<h2 style='text-align: center'>"+$scope.profile.username+" is following...</h2>",
        message:
          followScript + followingList
      });
    };
    // Show followers list of profile
    $scope.showFollowers = function(){
      var followers = $scope.profile.followers;
      var followScript =
        `<script>
          function chase(){
            bootbox.hideAll();
            window.location.href = '#/users/"+user+"'
          }
        </script>`;
      var followersList;
      // For each follower, add a clickable link to their profile page
      for (var i = 0; i < followers.length; i++){
        var user = followers[i];
        followersList +=
          `<h3 style='text-align: center'>
            <a style='cursor:pointer' onclick='chase()'>"+user+"</a>
          </h3>`;
      }
      // Bootbox modal alert follower list
      bootbox.alert({
        title:
          "<h2 style='text-align: center'>"+$scope.profile.username+" is followed by...</h2>",
        message:
          followScript + followersList
      });
    };
    // If user is logged in, define several additional functions
    if ($scope.isLoggedIn()){
      users.get(auth.currentUser().username).then(function(user){
          // Return if logged in user is viewing their own page
          $scope.isUser = function(){
            return $scope.profile.username === user.username;
          };
          // Return if user is following the profile
          $scope.followingProfile = function(){
            return user.following.includes($scope.profile.username);
          };
          // Follow the profile user
          $scope.followUser = function(){
            if (!$scope.followingProfile()) users.follow(user, $scope.profile);
            else {
              bootbox.confirm({
                title:
                  "<h2 style='text-align: center'><b>Are you sure?</b></h2>",
                message:
                  "<h4 style='text-align: center'>Do you want to unfollow this user?</h4>",
                buttons: {
                  cancel: {
                    label: 'Cancel'
                  },
                  confirm: {
                    label: 'Unfollow'
                  }
                },
                centerVertical: true,
                onEscape: true,
                backdrop: true,
                callback: function(result) {
                  if (result) users.follow(user, $scope.profile);
                }
              });
            }
          };
          // Enter profile edit mode
          $scope.startEditing = function(user){
            $scope.editing = true;
            document.getElementById('editImage').value =
              (user.image === "images/defaultuser.png") ? "" : user.image;
            document.getElementById('editBio').value =
              (user.bio === "I love EarWorm!") ? "" : user.bio;
          };
          // Stop editing
          $scope.cancelEdit = function(){
            $scope.editing = false;
          };
          // Save the fields from the edit into the user profile
          $scope.saveEdit = function(user){
            var newUser = user;
            var imageURL = document.getElementById('editImage').value;
            newUser.image = imageURL ? imageURL : "images/defaultuser.png";
            var bio = document.getElementById('editBio').value;
            newUser.bio = bio ? bio : "I love EarWorm!";
            newUser.favSong = document.getElementById('editSong').value;
            newUser.favArtist = document.getElementById('editArtist').value;
            users.editUser(user, newUser);
            $scope.editing = false;
          };
        });
      }
  }
])
// Post service
.controller('PostsCtrl', [
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
// NavBar controller
.controller('NavCtrl', [
  '$scope',
  'auth',
  function($scope, auth){
    $scope.isLoggedIn = auth.isLoggedIn;
    $scope.currentUser = auth.currentUser;
    $scope.logOut = auth.logOut;
  }
])
// Register + Log In controller
.controller('AuthCtrl', [
  '$scope',
  '$state',
  'users',
  'auth',
  function($scope, $state, users, auth){
    $scope.user = {};
    // Register a user
    $scope.register = function(){
      auth.register($scope.user).error(function(error){
        $scope.error = error;
      }).then(function(){
        users.create($scope.user);
        $state.go('home');
      });
    };
    // Log in a user
    $scope.logIn = function(){
      auth.logIn($scope.user).error(function(error){
        $scope.error = error;
      }).then(function(){
        $state.go('home');
      });
    };
  }
]);
