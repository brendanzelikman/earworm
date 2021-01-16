/* jshint esversion: 6 */
var app = angular.module('navController', ['ui.router']);

app.controller('NavCtrl', [
  '$scope',
  'auth',
  function($scope, auth){
    $scope.isLoggedIn = auth.isLoggedIn;
    $scope.currentUser = auth.currentUser;
    $scope.logOut = function(){
      bootbox.confirm({
        message: "<h2 style='text-align: center'><b class='bold'>Are you sure?</b></h2>",
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
        onEscape: true,
        backdrop: true,
        callback: function(result){
          if (result) {
            auth.logOut();
          }
        }
      });
    };
  }
]);
