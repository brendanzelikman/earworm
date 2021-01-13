/* jshint esversion: 6 */
var app = angular.module('authController', ['ui.router']);

app.controller('AuthCtrl', [
  '$scope',
  '$state',
  'users',
  'auth',
  function($scope, $state, users, auth){
    $scope.user = {};
    // Register a user
    $scope.register = function(){
      auth.register($scope.user).catch(function(err){
        $scope.error = err;
      });
      if (!jQuery.isEmptyObject($scope.user)){
        users.create($scope.user);
        $state.go('register');
      }
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
