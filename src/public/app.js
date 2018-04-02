var app = angular.module('app',['ngCookies']);

app.controller('noteController', function($scope, $http, $cookies){
    $scope.save = function(){
        var title = document.getElementById("notetitle").innerText // purposely really bad
        var body = document.getElementById("notebody").innerText
        var req = {
            method: 'PUT',
            url: '/api/note/'+window.location.pathname.match(/(\d*$)/)[0]+'/', //purposely bad code to show example
            headers: {
              'Token': $cookies.get('Token')
            },
            data: {"title":title, "data":body}
        }
        $http(req).then(
            function(result){
                console.log("saved");
                location.reload();
            },
            function(err){
                console.log(err)
                alert('Failed to save');
            }
        )
    }
    $scope.share = function(){
        var req1 = {
            method: 'GET',
            url: '/api/account/'+$scope.sharename.replace('/','%2f'),
            headers: {
              'Token': $cookies.get('Token')
            }
        }
        $http(req1).then(
            function(result){
                var req2 = {
                    method: 'PUT',
                    url: '/api/note/'+window.location.pathname.match(/(\d*$)/)[0]+'/share',
                    headers: {
                      'Token': $cookies.get('Token')
                    },
                    data: {"id":result.data.id}
                }
                $http(req2).then(function(result){
                    console.log(result);
                    if(!result.data.error)
                    $scope.shareresult = "Successfully shared with "+$scope.sharename
                }, function(result){
                    $scope.shareresult = 'Failed to share with '+$scope.sharename
                    console.log(result);
                })
            },
            function(error){
                console.log(error);
                alert("User "+$scope.sharename+' is not found');
            }
        );
        
        var scriptTag = document.createElement('script');
        scriptTag.src = "https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js";
        scriptTag.type = 'text/javascript';

        document.body.appendChild(scriptTag);
    }
});

app.controller('titleController', function($scope, $http, $cookies){
    $scope.newNote = function(){
        var req = {
            method: 'POST',
            url: '/api/note',
            headers: {
              'Token': $cookies.get('Token')
            },
            data: {"title":"Empty note", "data":"Empty note!"}
        }
        $http(req).then(function(result){
            document.location = '/note/'+result.data.id;
        }, function(err){console.log(err)})
    }
});