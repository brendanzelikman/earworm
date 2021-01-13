/* jshint esversion: 6 */
var app = angular.module("authService", ['ui.router']);

app.factory('auth', ['$http', '$window', '$rootScope', function($http, $window, $rootScope){
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
        auth.saveToken(data.token);
        $window.location.reload();
      }).catch((err) => {
        if (err.data.code === 11000){
            bootbox.alert({
              message: '<h2 style="text-align: center"><b>Username already taken!</b></h2>',
              backdrop: true
          });
        }
        else if (err.data.message){
          bootbox.alert({
            message: '<h2 style="text-align: center"><b>'+err.data.message+'!</b></h2>',
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
}]);
