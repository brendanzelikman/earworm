/* TO-DO LIST:
 - profile page
 - friends list
 - SPOTIFY API
 */

 /*jshint esversion: 6 */


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
      .state('posts', {
        url: '/posts/{id}',
        templateUrl: '/posts.html',
        controller: 'PostsCtrl',
        resolve: {
          post: ['$stateParams', 'posts', function($stateParams, posts){
            return posts.get($stateParams.id);
          }]
        }
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
    })
      .state('user', {
        url: '/user',
        templateUrl: '/user.html',
        controller: 'UserCtrl'
      });
    $urlRouterProvider.otherwise('home');
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
      var user = auth.currentUser();
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

  o.upvoteComment = function(post, comment){
    return $http.put('/posts/'+post._id+'/comments/'+comment._id+'/upvote', null, {
      headers: {Authorization: 'Bearer '+auth.getToken()}
    }).success(function(data){
      var user = auth.currentUser();
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
        return payload.username;
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
          if (result) { $window.localStorage.removeItem('earworm-token'); $window.location.reload(); }
        }
      });
    };
  return auth;
}])

.controller('MainCtrl', [
  '$scope',
  'posts',
  'auth',
  function($scope, posts, auth){

    $scope.posts = posts.posts;

    $scope.isLoggedIn = auth.isLoggedIn;

    $scope.upvotedPost = function(post){
      return post.upvotes.includes(auth.currentUser());
    };

    $scope.authoredPost = function(post){
      return post.author === auth.currentUser();
    };

    $scope.addPost = function(){

      var form =
      "<span style='margin-top: 10px; text-align: center;'><h2><b>" + auth.currentUser() + "</b> is listening to...</h2></span>" +
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

    var modalX = "<div style='margin-top: 20px;' class='icon-box'><i class='material-icons'>&#xE5CD;</i></div>";
    $scope.deletePost = function(post){
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

.controller('PostsCtrl', [
  '$scope',
  'posts',
  'post',
  'auth',
  function($scope, posts, post, auth){

    $scope.post = post;

    $scope.isLoggedIn = auth.isLoggedIn;

    $scope.authoredComment = function(comment){
      return comment.author === auth.currentUser();
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

    $scope.upvotePost = function(post){
      posts.upvotePost(post);
    };

    $scope.upvotedPost = function(post){
      return post.upvotes.includes(auth.currentUser());
    };

    $scope.upvoteComment = function(comment){
      posts.upvoteComment(post, comment);
    };

    $scope.upvotedComment = function(comment){
      return comment.upvotes.includes(auth.currentUser());
    };

    $scope.timeSince = function(date) {

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
  'auth',
  function($scope, $state, auth){

    $scope.user = {};

    $scope.register = function(){
      auth.register($scope.user).error(function(error){
        $scope.error = error;
      }).then(function(){
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
