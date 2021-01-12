/* jshint esversion: 6 */
var app = angular.module("userService", ['ui.router']);

app.factory('users', ['$http', 'auth', function($http, auth){
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
}]);
