/* TO-DO LIST:
 - profile page
 - friends list
 - SPOTIFY API
 */

 /*jshint esversion: 6 */

 function timeSince(date) {

 var seconds = Math.floor((new Date() - Date.parse(date)) / 1000);
 var interval = seconds / 31536000;

 if (interval > 1) {
  return Math.floor(interval) + "y";
 }
 interval = seconds / 2592000;
 if (interval > 1) {
  return Math.floor(interval) + "mo";
 }
 interval = seconds / 86400;
 if (interval > 1) {
  return Math.floor(interval) + "d";
 }
 interval = seconds / 3600;
 if (interval > 1) {
  return Math.floor(interval) + "h";
 }
 interval = seconds / 60;
 if (interval > 1) {
  return Math.floor(interval) + "m";
 }
 return Math.floor(seconds) + "s";
 }

var app = angular.module('EarWorm', ['ui.router'])

.config([
  '$stateProvider',
  '$urlRouterProvider',
  function($stateProvider, $urlRouterProvider){
    $stateProvider
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
    $urlRouterProvider.otherwise('home');
}])

.factory('users', ['$http', 'auth', function($http, auth){

  var o = {
    users: []
  };

  o.get = function(username){
    return $http.get('/users/'+username).then(function(res){
      return res.data;
    });
  };

  o.getAll = function() {
   return $http.get('/users').success(function(data) {
      angular.copy(data, o.users);
    });
  };

  o.create = function(user){
    return $http.post('/users', user, {
      headers: {Authorization: 'Bearer '+auth.getToken()}
    }).success(function(data){
      o.users.push(data);
    });
  };

  o.editUser = function(user, newUser){
    $http.put('/users/'+user._id, [user, newUser]);
  };

  return o;
}])

.factory('posts', ['$http', 'auth', function($http, auth){

  var o = {
    posts: []
  };

  o.get = function(id){
    return $http.get('/posts/'+id).then(function(res){
      return res.data;
    });
  };

  o.getAll = function() {
   return $http.get('/posts').success(function(data) {
      angular.copy(data, o.posts);
    });
  };

  o.create = function(post){
    return $http.post('/posts', post, {
      headers: {Authorization: 'Bearer '+auth.getToken()}
    }).success(function(data){
      o.posts.push(data);
    });
  };

  o.deletePost = function(post){
    return $http.delete('/posts/'+post._id, {
      headers: {Authorization: 'Bearer '+auth.getToken()}
    }).success(function(){
      var index = o.posts.indexOf(post);
      o.posts.splice(index, 1);
    });
  };

  o.editPost = function(post, newPost){
    $http.put('/posts/'+post._id, [post, newPost]);
  };

  o.deleteComment = function(post, comment){
    return $http.delete('/posts/'+post._id+'/comments/'+comment._id, {
      headers: {Authorization: 'Bearer '+auth.getToken()}
    }).success(function(data){
      var index = post.comments.indexOf(comment);
      post.comments.splice(index, 1);
    });
  };

  o.upvotePost = function(post){
    return $http.put('/posts/'+post._id+'/upvote', null, {
      headers: {Authorization: 'Bearer '+auth.getToken()}
    }).success(function(data){
      var user = auth.currentUser().username;
      if (!post.upvotes.includes(user)){
        post.upvotes.push(user);
      } else {
        var index = post.upvotes.indexOf(user);
        post.upvotes.splice(index, 1);
      }
      });
  };

  o.addComment = function(id, comment){
    return $http.post('/posts/'+id+'/comments', comment, {
      headers: {Authorization: 'Bearer '+auth.getToken()}
    });
  };

  o.editComment = function(post, comment, newBody){
    $http.put('/posts/'+post._id+'/comments/'+comment._id, [comment, newBody]);
    location.reload();
  };

  o.upvoteComment = function(post, comment){
    return $http.put('/posts/'+post._id+'/comments/'+comment._id+'/upvote', null, {
      headers: {Authorization: 'Bearer '+auth.getToken()}
    }).success(function(data){
      var user = auth.currentUser().username;
      if (!comment.upvotes.includes(user)){
        comment.upvotes.push(user);
      } else {
        var index = comment.upvotes.indexOf(user);
        comment.upvotes.splice(index, 1);
      }
      });
  };

  return o;
}])

.factory('auth', ['$http', '$window', '$rootScope', function($http, $window, $rootScope){
  var auth = {};

    auth.saveToken = function(token){
      $window.localStorage['earworm-token'] = token;
    };

    auth.getToken = function(){
      return $window.localStorage['earworm-token'];
    };

    auth.isLoggedIn = function(){
      var token = auth.getToken();

      if (token){
        var payload = JSON.parse($window.atob(token.split('.')[1]));
        return payload.exp > Date.now() / 1000;
      } else {
        return false;
      }
    };

    auth.currentUser = function(){
      if (auth.isLoggedIn()){
        var token = auth.getToken();
        var payload = JSON.parse($window.atob(token.split('.')[1]));
        return payload;
      }
    };

    auth.register = function(user){
      return $http.post('/register', user).success(function(data){
        auth.saveToken(data.token);

        $window.location.reload();
      }).catch((err) => {
        if (err.data.substring(4, 10) === "E11000"){
          bootbox.alert({
            message: '<h2 style="text-align: center"><b>Username already taken!</b></h2>',
            backdrop: true
        });
        }
      });
    };

    auth.logIn = function(user){
      return $http.post('/login', user).success(function(data){
        auth.saveToken(data.token);
      });
    };

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

.controller('MainCtrl', [
  '$scope',
  'posts',
  'users',
  'auth',
  function($scope, posts, users, auth){

    $scope.posts = posts.posts;
    $scope.users = users.users;

    $scope.sortedBy = localStorage.getItem('postSortedBy') || "-createdAt";

    $(function() {
      if (localStorage.getItem('postSelectedSort')) {
        $("#sortPost option").eq(localStorage.getItem('postSelectedSort')).prop('selected', true);
      }

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
    });

    $scope.isLoggedIn = auth.isLoggedIn;

    $scope.upvotedPost = function(post){
      return auth.currentUser() ?
      post.upvotes.includes(auth.currentUser().username) : false;
    };

    $scope.timeSince = function(date){
      return timeSince(date);
    };

    $scope.authoredPost = function(post){
      return post.author === auth.currentUser().username;
    };

    $scope.addPost = function(){

      var form =
      "<span style='margin-top: 10px; text-align: center;'><h2><b>" + auth.currentUser().username + "</b> is listening to...</h2></span>" +
      `<form style="margin-top: 30px;">
        <div class="form-group" style="float: left; width: 49%">
          <input id="title" type="text" placeholder="Title" class="form-control" required>
          </div>
        <div class="form-group" style="float: left; margin-left: 2%; width: 49%">
          <input id="artist" type="text" placeholder="Artist" class="form-control" required>
        </div>
        <div class="form-group">
          <input id="caption" style="height: 50px;" type="text" placeholder="Caption" class="form-control">
        </div>
      </form>`;

      bootbox.confirm({
        message: form,
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

    $scope.editPost = function(post){

      var song = post.song;
      var caption = post.caption;

      var form =
      "<span style='margin-top: 10px; text-align: center;'><h2><b>" + auth.currentUser().username + "</b> is listening to...</h2></span>" +
      `<form style="margin-top: 30px;">
        <div class="form-group" style="float: left; width: 49%">
          <input id="title" type="text" value="`+song.title+`" placeholder="Title" class="form-control" required>
          </div>
        <div class="form-group" style="float: left; margin-left: 2%; width: 49%">
          <input id="artist" type="text" value="`+song.artist+`" placeholder="Artist" class="form-control" required>
        </div>
        <div class="form-group">
          <input id="caption" style="height: 50px;" type="text" value="`+caption+`" placeholder="Caption" class="form-control">
        </div>
      </form>`;

      bootbox.confirm({
        message: form,
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

    $scope.deletePost = function(post){
      var modalX = "<div style='margin-top: 20px;' class='icon-box'><i class='material-icons'>&#xE5CD;</i></div>";
      bootbox.confirm({
        title: modalX + "<h2 style='text-align: center'><b>Are you sure?</b></h2>",
        message: "<h4 style='text-align: center'>Do you really want to delete this post? This cannot be undone.</h4>",
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
          if (result) { posts.deletePost(post); }
        }
      });
    };

    $scope.upvotePost = function(post){
      posts.upvotePost(post);
    };

}])

.controller('UserCtrl', [
  '$scope',
  'users',
  'user',
  'auth',
  function($scope, users, user, auth){
    $scope.user = user;
    $scope.isUser = function(){
      var authUser = auth.currentUser();
      if (authUser) return user.username === authUser.username;
      return false;
    };

    $scope.editing = false;

    $scope.startEditing = function(user){
      $scope.editing = true;
      document.getElementById('editImage').value =
        (user.image === "images/defaultuser.png") ? "" : user.image;
      document.getElementById('editBio').value =
        (user.bio === "I love EarWorm!") ? "" : user.bio;
    };

    $scope.cancelEdit = function(){
      $scope.editing = false;
    };

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
  }
])

.controller('PostsCtrl', [
  '$scope',
  'posts',
  'post',
  'auth',
  function($scope, posts, post, auth){

    $scope.post = post;

    $scope.sortedBy = localStorage.getItem('commentSortedBy') || "-createdAt";

    $(function() {
      if (localStorage.getItem('commentSelectedSort')) {
        $("#sortComment option").eq(localStorage.getItem('commentSelectedSort')).prop('selected', true);
      }

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
    });

    $scope.isLoggedIn = auth.isLoggedIn;

    $scope.authoredComment = function(comment){
      return comment.author === auth.currentUser().username;
    };

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

    var modalX = "<div style='margin-top: 20px;' class='icon-box'><i class='material-icons'>&#xE5CD;</i></div>";
    $scope.deleteComment = function(comment){
      bootbox.confirm({
        title: modalX + "<h2 style='text-align: center'><b>Are you sure?</b></h2>",
        message: "<h4 style='text-align: center'>Do you really want to delete this comment? This cannot be undone.</h4>",
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
          if (result) { posts.deleteComment(post, comment); }
        }
      });
    };

    $scope.editComment = function(post, comment){

      var body = comment.body;

      var form =
      "<span style='margin-top: 10px; text-align: center;'><h2><b>" + auth.currentUser().username + " wants to say...</h2></span>" +
      `<form style="margin-top: 30px;">
        <div class="form-group">
          <input id="body" style="height: 50px;" type="text" value="`+body+`" placeholder="Body" class="form-control">
        </div>
      </form>`;

      bootbox.confirm({
        message: form,
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

    $scope.upvotePost = function(post){
      posts.upvotePost(post);
    };

    $scope.upvotedPost = function(post){
      return auth.currentUser() ?
      post.upvotes.includes(auth.currentUser().username) : false;
    };

    $scope.upvoteComment = function(comment){
      posts.upvoteComment(post, comment);
    };

    $scope.upvotedComment = function(comment){
      return auth.currentUser() ?
      comment.upvotes.includes(auth.currentUser().username) : false;
    };

    $scope.timeSince = function(date){
      return timeSince(date);
    };

}])

.controller('NavCtrl', [
  '$scope',
  'auth',
  function($scope, auth){
    $scope.isLoggedIn = auth.isLoggedIn;
    $scope.currentUser = auth.currentUser;
    $scope.logOut = auth.logOut;
  }
])

.controller('AuthCtrl', [
  '$scope',
  '$state',
  'users',
  'auth',
  function($scope, $state, users, auth){

    $scope.user = {};

    $scope.register = function(){
      auth.register($scope.user).error(function(error){
        $scope.error = error;
      }).then(function(){
        users.create($scope.user);
        $state.go('home');
      });
    };

  $scope.logIn = function(){
    auth.logIn($scope.user).error(function(error){
      $scope.error = error;
    }).then(function(){
      $state.go('home');
    });
  };
  }
]);
