// Copyright 2016 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Directive for the miscellaneous tab in the admin panel.
 */

require('domain/utilities/url-interpolation.service.ts');
require('pages/admin-page/services/admin-data.service.ts');
require('pages/admin-page/services/admin-task-manager.service.ts');

require('constants.ts');
require('pages/admin-page/admin-page.constants.ajs.ts');

angular.module('oppia').directive('adminMiscTab', [
  '$http', '$window',
  'AdminTaskManagerService', 'UrlInterpolationService', 'ADMIN_HANDLER_URL',
  'ADMIN_TOPICS_CSV_DOWNLOAD_HANDLER_URL', 'MAX_USERNAME_LENGTH',
  function(
      $http, $window,
      AdminTaskManagerService, UrlInterpolationService, ADMIN_HANDLER_URL,
      ADMIN_TOPICS_CSV_DOWNLOAD_HANDLER_URL, MAX_USERNAME_LENGTH) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {
        setStatusMessage: '='
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/admin-page/misc-tab/admin-misc-tab.directive.html'),
      controllerAs: '$ctrl',
      controller: ['$scope', function($scope) {
        var ctrl = this;
        var DATA_EXTRACTION_QUERY_HANDLER_URL = (
          '/explorationdataextractionhandler');
        var SEND_DUMMY_MAIL_HANDLER_URL = (
          '/senddummymailtoadminhandler');
        var MEMORY_CACHE_HANDLER_URL = '/memorycacheadminhandler';
        var UPDATE_USERNAME_HANDLER_URL = '/updateusernamehandler';
        var EXPLORATIONS_LATEX_SVG_HANDLER = '/explorationslatexsvghandler';
        var irreversibleActionMessage = (
          'This action is irreversible. Are you sure?');

        ctrl.MAX_USERNAME_LENGTH = MAX_USERNAME_LENGTH;

        ctrl.clearSearchIndex = function() {
          if (AdminTaskManagerService.isTaskRunning()) {
            return;
          }
          if (!$window.confirm(irreversibleActionMessage)) {
            return;
          }

          ctrl.setStatusMessage('Clearing search index...');

          AdminTaskManagerService.startTask();
          $http.post(ADMIN_HANDLER_URL, {
            action: 'clear_search_index'
          }).then(function() {
            ctrl.setStatusMessage('Index successfully cleared.');
            AdminTaskManagerService.finishTask();
          }, function(errorResponse) {
            ctrl.setStatusMessage(
              'Server error: ' + errorResponse.data.error);
            AdminTaskManagerService.finishTask();
          });
        };

        ctrl.flushMigrationBotContributions = function() {
          if (AdminTaskManagerService.isTaskRunning()) {
            return;
          }
          if (!$window.confirm(irreversibleActionMessage)) {
            return;
          }

          ctrl.setStatusMessage('Flushing migration bot contributions...');

          AdminTaskManagerService.startTask();
          $http.post(ADMIN_HANDLER_URL, {
            action: 'flush_migration_bot_contribution_data'
          }).then(function() {
            ctrl.setStatusMessage(
              'Migration bot contributions successfully flushed.');
            AdminTaskManagerService.finishTask();
          }, function(errorResponse) {
            ctrl.setStatusMessage(
              'Server error: ' + errorResponse.data.error);
            AdminTaskManagerService.finishTask();
          });
        };

        ctrl.regenerateOpportunitiesRelatedToTopic = function() {
          if (AdminTaskManagerService.isTaskRunning()) {
            return;
          }
          if (!$window.confirm(irreversibleActionMessage)) {
            return;
          }
          ctrl.regenerationMessage = 'Regenerating opportunities...';
          $http.post(ADMIN_HANDLER_URL, {
            action: 'regenerate_topic_related_opportunities',
            topic_id: ctrl.topicIdForRegeneratingOpportunities
          }).then(function(response) {
            ctrl.regenerationMessage = (
              'No. of opportunities model created: ' +
              response.data.opportunities_count);
          }, function(errorResponse) {
            ctrl.regenerationMessage = (
              'Server error: ' + errorResponse.data.error);
          });
        };

        ctrl.uploadTopicSimilaritiesFile = function() {
          var file = (
            <HTMLInputElement>document.getElementById(
              'topicSimilaritiesFile')).files[0];
          var reader = new FileReader();
          reader.onload = function(e) {
            var data = (<FileReader>e.target).result;
            $http.post(ADMIN_HANDLER_URL, {
              action: 'upload_topic_similarities',
              data: data
            }).then(function() {
              ctrl.setStatusMessage(
                'Topic similarities uploaded successfully.');
            }, function(errorResponse) {
              ctrl.setStatusMessage(
                'Server error: ' + errorResponse.data.error);
            });
          };
          reader.readAsText(file);
        };

        ctrl.downloadTopicSimilaritiesFile = function() {
          $window.location.href = ADMIN_TOPICS_CSV_DOWNLOAD_HANDLER_URL;
        };

        var setDataExtractionQueryStatusMessage = function(message) {
          ctrl.showDataExtractionQueryStatus = true;
          ctrl.dataExtractionQueryStatusMessage = message;
        };


        ctrl.sendDummyMailToAdmin = function() {
          $http.post(SEND_DUMMY_MAIL_HANDLER_URL)
            .then(function(response) {
              ctrl.setStatusMessage('Success! Mail sent to admin.');
            }, function(errorResponse) {
              ctrl.setStatusMessage(
                'Server error: ' + errorResponse.data.error);
            });
        };

        ctrl.flushMemoryCache = function() {
          $http.post(MEMORY_CACHE_HANDLER_URL)
            .then(function(response) {
              ctrl.setStatusMessage('Success! Memory Cache Flushed.');
            }, function(errorResponse) {
              ctrl.setStatusMessage(
                'Server error: ' + errorResponse.data.error);
            });
        };

        ctrl.getMemoryCacheProfile = function() {
          $http.get(MEMORY_CACHE_HANDLER_URL)
            .then(function(response) {
              ctrl.result = {
                totalAllocatedInBytes: response.data.total_allocation,
                peakAllocatedInBytes: response.data.peak_allocation,
                totalKeysStored: response.data.total_keys_stored
              };
              ctrl.memoryCacheDataFetched = true;
              ctrl.setStatusMessage('Success!');
            }, function(errorResponse) {
              ctrl.setStatusMessage(
                'Server error: ' + errorResponse.data.error);
            });
        };

        ctrl.updateUsername = function() {
          ctrl.setStatusMessage('Updating username...');
          $http.put(
            UPDATE_USERNAME_HANDLER_URL, {
              old_username: ctrl.oldUsername,
              new_username: ctrl.newUsername
            }).then(
            function(response) {
              ctrl.setStatusMessage(
                'Successfully renamed ' + ctrl.oldUsername + ' to ' +
                  ctrl.newUsername + '!');
            }, function(errorResponse) {
              ctrl.setStatusMessage(
                'Server error: ' + errorResponse.data.error);
            }
          );
        };

        ctrl.submitQuery = function() {
          var STATUS_PENDING = (
            'Data extraction query has been submitted. Please wait.');
          var STATUS_FINISHED = 'Loading the extracted data ...';
          var STATUS_FAILED = 'Error, ';

          setDataExtractionQueryStatusMessage(STATUS_PENDING);

          var downloadUrl = DATA_EXTRACTION_QUERY_HANDLER_URL + '?';

          downloadUrl += 'exp_id=' + encodeURIComponent(ctrl.expId);
          downloadUrl += '&exp_version=' + encodeURIComponent(
            ctrl.expVersion);
          downloadUrl += '&state_name=' + encodeURIComponent(
            ctrl.stateName);
          downloadUrl += '&num_answers=' + encodeURIComponent(
            ctrl.numAnswers);

          $window.open(downloadUrl);
        };

        ctrl.resetForm = function() {
          ctrl.expId = '';
          ctrl.expVersion = 0;
          ctrl.stateName = '';
          ctrl.numAnswers = 0;
          ctrl.showDataExtractionQueryStatus = false;
        };
        ctrl.$onInit = function() {
          ctrl.numberOfExplorationsLeftToUpdate;
          $http.get(
            EXPLORATIONS_LATEX_SVG_HANDLER, {
              params: {
                item_to_fetch: 'number_of_explorations_left_to_update'
              }
            }).then(function(response) {
            ctrl.numberOfExplorationsLeftToUpdate = (
              response.data.number_of_explorations_left_to_update);
          });

          ctrl.generateSvgs = true;
          ctrl.topicIdForRegeneratingOpportunities = null;
          ctrl.regenerationMessage = null;
          ctrl.oldUsername = null;
          ctrl.newUsername = null;
        };
      }]
    };
  }
]);
