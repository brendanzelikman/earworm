 /* jshint esversion: 6 */
var app = angular.module('EarWorm', [
  'mainController',
  'postController',
  'userController',
  'authController',
  'navController',
  'postService',
  'userService',
  'authService',
  'ui.router'
]);

app.config([
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
}]);
