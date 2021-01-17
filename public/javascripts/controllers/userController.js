/* jshint esversion: 6 */
var app = angular.module("userController", ['ui.router']);

app.controller('UserCtrl', [
  '$scope',
  'users',
  'user',
  'auth',
  function($scope, users, user, auth){
    if (user === null) auth.goHome();
    // Initialized scope variables
    $scope.profile = user;
    $scope.editing = false;
    $scope.isUser = function(){};
    $scope.isLoggedIn = auth.isLoggedIn;
    // Show following list of profile
    $scope.showFollowing = function(){
      var following = $scope.profile.following;
      var followingList = "";
      // For each following, add a clickable link to their profile page
      for (var i = 0; i < following.length; i++){
        var user = following[i];
        followingList +=
          `<h3 style='text-align: center'>
            <a style='cursor:pointer' onclick='bootbox.hideAll();' href='#/users/`+user+`'>`+user+`</a>
          </h3>`;
      }
      // Bootbox modal alert following list
      bootbox.alert({
        title:
          "<h2 style='text-align: center'>"+$scope.profile.username+" is following...</h2>",
        message:
          '' + followingList
      });
    };
    // Show followers list of profile
    $scope.showFollowers = function(){
      var followers = $scope.profile.followers;
      var followersList = "";
      // For each follower, add a clickable link to their profile page
      for (var i = 0; i < followers.length; i++){
        var user = followers[i];
        followersList +=
          `<h3 style='text-align: center'>
            <a style='cursor:pointer' onclick='bootbox.hideAll();' href='#/users/`+user+`'>`+user+`</a>
          </h3>`;
      }
      // Bootbox modal alert follower list
      bootbox.alert({
        title:
          "<h2 style='text-align: center'>"+$scope.profile.username+" is followed by...</h2>",
        message:
          '' + followersList
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
          // Delete user profile
          $scope.deleteProfile = function(user){
            bootbox.confirm({
              title:
                `<div style='margin-top: 20px;' class='icon-box'>
                   <i class='material-icons'>&#xE5CD;</i>
                 </div>
                 <h2 style='text-align: center'><b class='bold'>Are you sure?</b></h2>`,
              message:
                `<h4 style='text-align: center'>
                   Do you really want to delete your profile?
                   This <b class='bold'>cannot</b> be undone.
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
                if (result){
                  users.deleteUser(user);
                  auth.logOut();
                }
              }
            });
          };
        });
      }
  }
]);
