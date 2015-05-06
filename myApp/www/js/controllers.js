angular.module('starter.controllers', ['ionic', 'MyCtrl'])

.controller('MyCtrl', function($scope, $timeout) {
    $scope.myTitle = 'Template';
    
    $scope.data = { 'volume' : '5' };
    
    var timeoutId = null;
    
    $scope.$watch('data.volume', function() {
        
        
        console.log('Has changed');
        
        if(timeoutId !== null) {
            console.log('Ignoring this movement');
            return;
        }
        
        console.log('Not going to ignore this one');
        timeoutId = $timeout( function() {
            
            console.log('It changed recently!');
            
            $timeout.cancel(timeoutId);
            timeoutId = null;
            
            // Now load data from server 
        }, 1000); 
        
        
    });
    
});