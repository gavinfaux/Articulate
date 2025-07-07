'use strict';

var articulateapp = angular.module('articulateapp', [
  'ngRoute',
  'ngSanitize'
]);

articulateapp.config(['$httpProvider', function ($httpProvider) {
  $httpProvider.defaults.xsrfCookieName = '.AspNetCore.Antiforgery';
  $httpProvider.defaults.xsrfHeaderName = 'RequestVerificationToken';
}]);

articulateapp.config(['$routeProvider', function ($routeProvider) {
  $routeProvider.
    when('/md', {
      templateUrl: 'md.html',
      controller: ['$scope', '$q', 'angularHelper', '$http', '$location', '$sanitize', function ($scope, $q, angularHelper, $http, $location, $sanitize) {
        function insertAtCaretPos($scope, text, pos) {
          var content = $scope.$parent.md || "";
          $scope.$parent.md = content.substr(0, pos) + text + content.substr(pos);
        }

        function getCaret(el) {
          return el.selectionStart || 0;
        }

        $http.get($scope.$parent.isAuthUrl).then(function (data) {
          if (data.data === "true") {
            $scope.caret = 0;

            $scope.$watch('$parent.md', function (newVal, oldVal) {
              if (newVal !== oldVal) {
                var tokens = (newVal || "").match(/\[i:\d+:[^\]]+\]/g) || [];
                var validIndices = tokens.map(function (t) { return parseInt(t.match(/\[i:(\d+)/)[1]); });
                $scope.$parent.files = $scope.$parent.files.filter(function (_, i) { return validIndices.includes(i); });
              }
            });

            $scope.addFile = function () {
              $("#insertFile").click();
            };

            $scope.addCamera = function () {
              $("#insertCamera").click();
              if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                alert("Camera not supported or permission denied.");
              }
            };

            $scope.storeCaret = function () {
              var elem = $("#mdInput").get(0);
              $scope.caret = getCaret(elem);
            };

            $scope.$on("filesSelected", function (e, o) {
              if (o.files && Array.isArray(o.files) && o.files.length === 1) {
                var file = o.files[0];
                var check = file.name.replace(/\\/g, "/");
                if (check.match(/^\.\.|\/\.\./)) {
                  alert("Invalid file path selected.");
                  return;
                }
                if (file.size > 10 * 1024 * 1024) {
                  alert("File too large, max 10MB.");
                  return;
                }
                var allowedMimeTypes = ["image/jpeg", "image/png", "image/gif"];
                var allowedExtensions = ["jpg", "jpeg", "png", "gif"];
                var fileExtension = check.split(".").pop().toLowerCase();
                if (allowedExtensions.indexOf(fileExtension) === -1 || (file.type && allowedMimeTypes.indexOf(file.type) === -1)) {
                  alert("Only JPEG, PNG and GIF images are allowed.");
                  return;
                }
                var fileName = check.split(".").slice(0, -1).join(".");
                var cleanFileName = fileName.replace(/[\\:*?"<>|\[\] ]/g, "_").replace(/\.+/g, ".").trim();
                var reservedNames = ["con", "prn", "aux", "nul", "com1", "lpt1"];
                if (!cleanFileName || reservedNames.includes(cleanFileName.toLowerCase())) {
                  alert("Invalid filename.");
                  return;
                }
                if (cleanFileName.length > 100) {
                  alert("Filename too long.");
                  return;
                }
                var fileWithExtension = cleanFileName + (file.type === "image/heic" ? ".jpg" : "." + fileExtension);
                var token = "[i:" + ($scope.$parent.files ? $scope.$parent.files.length : 0) + ":" + fileWithExtension + "]";
                var tokenRegex = /^\[i:\d+:[a-zA-Z0-9_-]+\.(jpg|jpeg|png|gif)\]$/;
                if (!token.match(tokenRegex)) {
                  alert("Invalid token format.");
                  return;
                  var processFile = file.type === "image/heic" ? $q(function (resolve, reject) {
                  heicTo.convert(file).then(function (convertedBlob) {
                    resolve(new File([convertedBlob], fileWithExtension, { type: "image/jpeg" }));
                  }).catch(function (error) {
                    reject(error);
                  });
                }) : $q.when(new File([file], fileWithExtension, { type: file.type }));
                processFile.then(function (renamedFile) {
                  angularHelper.safeApply($scope, function () {
                    $scope.$parent.files = $scope.$parent.files || [];
                    $scope.$parent.files.push(renamedFile);
                    insertAtCaretPos($scope, token, $scope.caret);
                  });
                }).catch(function (error) {
                  alert("Failed to process HEIC image: " + error.message);
                });
              } else {
                alert("Please select exactly one file.");
                return;
              }
            });

            $scope.$parent.caption = "New Blog Post";
            $scope.$parent.nextPath = "/optional";
            $scope.$parent.nextText = "»";
            $scope.$parent.prevPath = null;
          } else {
            $location.path("/login").search({ r: "md" });
          }
        });
      }]
    }).
    when('/optional', {
      templateUrl: 'optional.html',
      controller: ['$scope', function ($scope) {
        $scope.$parent.caption = "Optional values";
        $scope.$parent.nextPath = "/submit";
        $scope.$parent.nextText = "Post it!";
        $scope.$parent.prevPath = "/md";
      }]
    }).
    when('/login', {
      templateUrl: 'login.html',
      controller: ['$scope', '$http', '$location', function ($scope, $http, $location) {
        $scope.$parent.caption = "User login";
        $scope.$parent.nextPath = null;
        $scope.$parent.nextText = null;
        $scope.$parent.prevPath = null;
        $scope.username = "";
        $scope.password = "";
        $scope.login = function () {
          $scope.articulateForm.$setDirty();
          if ($scope.articulateForm.$valid) {
            $http.post($scope.$parent.doAuthUrl, {
              username: $scope.username,
              password: $scope.password
            }).success(function (data, status, headers, config) {
              $location.path("/" + $location.search().r);
            }).error(function (data, status, headers, config) {
              $scope.failed = true;
            });
          }
        };
      }]
    }).
    when('/submit', {
      templateUrl: 'submit.html',
      controller: ['$scope', '$location', '$http', 'httpHelper', function ($scope, $location, $http, httpHelper) {
        if ($scope.md.length === 0) {
          $location.path("/md");
          return;
        }
        $scope.$parent.caption = "Submitting post...";
        $scope.$parent.nextPath = null;
        $scope.$parent.nextText = null;
        $scope.$parent.prevPath = null;
        $http.get($scope.$parent.isAuthUrl).then(function (data) {
          if (data.data === "true") {
            httpHelper.postMultiPartRequest($scope, $scope.$parent.postUrl,
              [{
                key: "model",
                value: {
                  articulateNodeId: $scope.$parent.articulateNodeId,
                  title: $scope.$parent.title,
                  body: $scope.$parent.md,
                  tags: $scope.$parent.tags,
                  categories: $scope.$parent.categories,
                  excerpt: $scope.$parent.excerpt,
                  slug: $scope.$parent.slug
                }
              }], function (d, formData) {
                for (var f in $scope.$parent.files) {
                  formData.append($scope.$parent.files[f].name, $scope.$parent.files[f]);
                }
              },
              function (d, status, headers, config) {
                $scope.result = d.url;
                $scope.$parent.caption = "Post successful";
              }, function (d, status, headers, config) {
                if (d.Message) {
                  alert(d.Message);
                } else {
                  alert("Failed! " + angular.toJson(d));
                }
              });
          } else {
            $location.path("/login").search({ r: "submit" });
          }
        });
      }]
    }).
    otherwise({
      redirectTo: '/md'
    });
}]);

articulateapp.controller('EditorController', ['$scope', '$location', '$element', '$sanitize', function ($scope, $location, $element, $sanitize) {
  $scope.postUrl = $element.attr("data-articulate-post-url");
  $scope.isAuthUrl = $element.attr("data-umbraco-isauth-url");
  $scope.doAuthUrl = $element.attr("data-umbraco-doauth-url");
  $scope.articulateNodeId = $element.attr("data-articulate-nodeId");
  $scope.files = [];
  $scope.nextPath = null;
  $scope.prevPath = null;
  $scope.nextText = "redo";
  $scope.prevText = "undo";
  $scope.caption = "";
  $scope.title = "";
  $scope.md = "";
  $scope.tags = "";
  $scope.categories = "";
  $scope.excerpt = "";
  $scope.slug = "";
  $scope.go = function (p) {
    $scope.articulateForm.$setDirty();
    if ($scope.articulateForm.$valid) {
      $location.path(p);
      $scope.articulateForm.$setPristine();
    }
  };
}]);

articulateapp.directive('filesSelected', function () {
  return {
    restrict: "A",
    scope: true,
    link: function (scope, el, attrs) {
      el.bind('change', function (event) {
        var files = event.target.files;
        scope.$emit("filesSelected", { files: files });
      });
    }
  };
});

articulateapp.directive('materialRefresh', ['$timeout', function ($timeout) {
  return {
    restrict: "E",
    link: function (scope, el, attrs) {
      $timeout(function () {
        componentHandler.upgradeAllRegistered();
      });
    }
  };
}]);

articulateapp.factory("angularHelper", function () {
  return {
    safeApply: function (scope, fn) {
      if (scope.$$phase || scope.$root.$$phase) {
        if (angular.isFunction(fn)) {
          fn();
        }
      } else {
        if (angular.isFunction(fn)) {
          scope.$apply(fn);
        } else {
          scope.$apply();
        }
      }
    }
  };
});

articulateapp.factory("httpHelper", ['$http', 'angularHelper', function ($http, angularHelper) {
  return {
    postMultiPartRequest: function (scope, url, jsonData, transformCallback, successCallback, failureCallback) {
      if (!jsonData) {
        throw "jsonData cannot be null";
      }
      if (angular.isArray(jsonData)) {
        angular.forEach(jsonData, function (item) {
          if (!item.key || !item.value) {
            throw "jsonData array item must have both a key and a value property";
          }
        });
      } else if (!jsonData.key || !jsonData.value) {
        throw "jsonData object must have both a key and a value property";
      }
      angularHelper.safeApply(scope, function () {
        // Get CSRF token from cookie
        var getCookie = function () {
          var cookies = document.cookie.split(';');
          for (var cookie of cookies) {
            var trimmed = cookie.trim();
            if (trimmed.startsWith('.AspNetCore.Antiforgery')) {
              return trimmed.split('=')[1];
            }
          }
          return null;
        };
        var csrfToken = getCookie();
        $http({
          method: 'POST',
          url: url,
          headers: {
            'Content-Type': undefined
          },
          transformRequest: function (data) {
            var formData = new FormData();
            if (angular.isArray(data)) {
              angular.forEach(data, function (item) {
                formData.append(item.key, !angular.isString(item.value) ? angular.toJson(item.value) : item.value);
              });
            } else {
              formData.append(data.key, !angular.isString(data.value) ? angular.toJson(data.value) : data.value);
            }
            if (csrfToken) {
              formData.append('__RequestVerificationToken', csrfToken);
            } else {
              console.error('CSRF token not found in cookies');
            }
            if (transformCallback) {
              transformCallback.apply(this, [data, formData]);
            }
            return formData;
          },
          data: jsonData
        }).
          success(function (data, status, headers, config) {
            if (successCallback) {
              successCallback.apply(this, [data, status, headers, config]);
            }
          }).
          error(function (data, status, headers, config) {
            if (failureCallback) {
              failureCallback.apply(this, [data, status, headers, config]);
            }
          });
      });
    }
  };
}]);
