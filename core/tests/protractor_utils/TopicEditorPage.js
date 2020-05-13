// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Page object for the topics editor page, for use
 * in Protractor tests.
 */

var dragAndDropScript = require('html-dnd').code;
var forms = require('./forms.js');
var waitFor = require('./waitFor.js');
var workflow = require('../protractor_utils/workflow.js');
var path = require('path');
var ExplorationEditorPage =
  require('../protractor_utils/ExplorationEditorPage.js');

var TopicEditorPage = function() {
  var EDITOR_URL_PREFIX = '/topic_editor/';
  var createStoryButton = element(
    by.css('.protractor-test-create-story-button'));
  var newStoryTitleField = element(
    by.css('.protractor-test-new-story-title-field'));
  var confirmStoryCreationButton = element(
    by.css('.protractor-test-confirm-story-creation-button'));
  var storyListItems = element.all(
    by.css('.protractor-test-story-list-item'));

  var topicNameField = element(
    by.css('.protractor-test-topic-name-field'));
  var topicDescriptionField = element(
    by.css('.protractor-test-topic-description-field'));
  var saveTopicButton = element(
    by.css('.protractor-test-save-topic-button'));
  var publishTopicButton = element(
    by.css('.protractor-test-publish-topic-button'));
  var commitMessageField = element(
    by.css('.protractor-test-commit-message-input'));
  var closeSaveModalButton = element(
    by.css('.protractor-test-close-save-modal-button'));
  var subtopicsTabButton = element(
    by.css('.protractor-test-subtopics-tab-button'));
  var addSubtopicCard = element(by.css('.protractor-test-add-subtopic-card'));
  var newSubtopicTitlefield = element(
    by.css('.protractor-test-new-subtopic-title-field'));
  var confirmSubtopicCreationButton = element(
    by.css('.protractor-test-confirm-subtopic-creation-button'));
  var subtopics = element.all(by.css('.protractor-test-subtopic'));
  var subtopicColumns = element.all(
    by.css('.protractor-test-subtopic-column'));
  var deleteSubtopicButtons = element.all(
    by.css('.protractor-test-delete-subtopic-button'));
  var skillCards = element.all(
    by.css('.protractor-test-skill-card'));
  var uncategorizedSkillItems = element.all(
    by.css('.protractor-test-uncategorized-skill-item'));
  var uncategorizedSkillsContainer = element(
    by.css('.protractor-test-uncategorized-skills-container'));
  var editSubtopicButtons = element.all(
    by.css('.protractor-test-edit-subtopic-button'));
  var subtopicTitleField = element(
    by.css('.protractor-test-subtopic-title-field'));
  var saveSubtopicButton = element(
    by.css('.protractor-test-save-subtopic-button'));
  var pageEditor = element(
    by.css('.protractor-test-subtopic-page-contents'));
  var subtopicTitles = element.all(by.css('.protractor-test-subtopic-title'));
  var questionsTabButton = element(
    by.css('.protractor-test-questions-tab-button'));
  var createQuestionButton = element(
    by.css('.protractor-test-create-question-button'));
  var skillItems = element.all(by.css('.protractor-test-skill-item'));
  var skillListItems = element.all(
    by.css('.protractor-test-skills-list-item'));
  var skillSaveButton = element(
    by.css('.protractor-test-confirm-skill-selection-button'));
  var confirmSkillButton = element(
    by.css('.protractor-test-confirm-skill-button'));
  var confirmSkillDifficultyButton = element(
    by.css('.protractor-test-confirm-skill-difficulty-button'));
  var saveQuestionButton = element(
    by.css('.protractor-test-save-question-button'));
  var questionItems = element.all(
    by.css('.protractor-test-question-list-item'));
  var questionItem = element(by.css('.protractor-test-question-list-item'));
  var selectSkillDropdown = element(
    by.css('.protractor-test-select-skill-dropdown'));
  var subtopicThumbnailImageElement = element(
    by.css('.subtopic-thumbnail .protractor-test-custom-photo'));
  var subtopicThumbnailButton = element(
    by.css('.subtopic-thumbnail .protractor-test-photo-button'));
  var topicThumbnailImageElement = element(
    by.css('.thumbnail-editor .protractor-test-custom-photo'));
  var topicThumbnailButton = element(
    by.css('.thumbnail-editor .protractor-test-photo-button'));
  var thumbnailContainer = element(
    by.css('.protractor-test-thumbnail-container'));
  var linkAnotherSkillButton = element(
    by.css('.protractor-test-link-skill'));

  var dragAndDrop = function(fromElement, toElement) {
    browser.executeScript(dragAndDropScript, fromElement, toElement);
  };

  this.get = function(topicId) {
    browser.get(EDITOR_URL_PREFIX + topicId);
    return waitFor.pageToFullyLoad();
  };

  this.getTopicThumbnailSource = function() {
    return workflow.getImageSource(topicThumbnailImageElement);
  };

  this.getSubtopicThumbnailSource = function() {
    return workflow.getImageSource(subtopicThumbnailImageElement);
  };

  this.submitTopicThumbnail = function(imgPath) {
    return workflow.submitImage(
      topicThumbnailButton, thumbnailContainer, imgPath);
  };

  this.submitSubtopicThumbnail = function(imgPath) {
    return workflow.submitImage(
      subtopicThumbnailButton, thumbnailContainer, imgPath);
  };

  this.publishTopic = function() {
    publishTopicButton.click();
    return waitFor.invisibilityOf(
      publishTopicButton, 'Topic is taking too long to publish.');
  };

  this.expectNumberOfQuestionsForSkillWithDescriptionToBe = function(
      count, skillDescription) {
    selectSkillDropdown.click();
    element(by.css('option[label="' + skillDescription + '"]')).click();
    waitFor.visibilityOf(
      questionItem, 'Question takes too long to appear');
    questionItems.then(function(items) {
      expect(items.length).toEqual(count);
    });
  };

  this.selectSkillWithDescriptionFromDropDown = function(skillDescription) {
    waitFor.elementToBeClickable(
      selectSkillDropdown, 'Skills dropdown taking too long to appear.');
    selectSkillDropdown.click();
    waitFor.elementToBeClickable(
      element(by.css('option[label="' + skillDescription + '"]'))
      , 'Skill from dropdown taking too long to be clickable'
    );
    element(by.css('option[label="' + skillDescription + '"]')).click();
  };

  this.openQuestionEditor = function(index) {
    waitFor.visibilityOf(
      questionItem, 'Question takes too long to appear');
    questionItems.then(function(questions) {
      waitFor.elementToBeClickable(
        questions[index], 'Question takes too long to be clickable');
      questions[index].click();
      waitFor.visibilityOf(
        saveQuestionButton, 'Question editor takes too long to open');
    });
  };

  this.saveQuestion = function() {
    waitFor.elementToBeClickable(
      saveQuestionButton,
      'Save Question button takes too long to be clickable');
    saveQuestionButton.click();
  };

  this.createQuestionForSkillWithDescription = async function(
      skillDescription) {
    await createQuestionButton.click();
    var skillsLength = await skillItems.count();
    for (var i = 0; i < skillsLength; i++) {
      var skillText = await skillItems.get(i).getText();
      if (skillText === skillDescription) {
        await skillItems.get(i).click();
        waitFor.elementToBeClickable(
          confirmSkillButton,
          'Confirm Skill button takes too long to be clickable');
        await confirmSkillButton.click();
        await confirmSkillDifficultyButton.click();
      }
    }
    return new Promise(function(resolve, reject) {
      resolve('done');
    });
  };

  this.linkSkillWithDescriptionToQuestion = async function(skillDescription) {
    await questionItems.get(0).click();
    await linkAnotherSkillButton.click();
    var skillsLength = await skillListItems.count();
    for (var i = 0; i < skillsLength; i++) {
      var skillText = await skillListItems.get(i).getText();
      if (skillText === skillDescription) {
        await skillListItems.get(i).click();
        await skillSaveButton.click();
        waitFor.elementToBeClickable(
          saveQuestionButton,
          'Save Question button takes too long to be clickable');
        await saveQuestionButton.click();
      }
    }
    return new Promise(function(resolve, reject) {
      resolve('done');
    });
  };

  this.editQuestionContents = function(index, newContent, commitMessage) {
    var explorationEditorPage =
                     new ExplorationEditorPage.ExplorationEditorPage();
    var explorationEditorMainTab = explorationEditorPage.getMainTab();
    questionItems.then(
      function(questions) {
        questions[index].click();
        explorationEditorMainTab.setContent(forms.toRichText(newContent));
        waitFor.elementToBeClickable(
          saveQuestionButton,
          'Save Question button takes too long to be clickable');
        saveQuestionButton.click();
        // Confirm the edit by adding a commit message.
        commitMessageField.sendKeys(commitMessage);
        waitFor.elementToBeClickable(
          closeSaveModalButton,
          'Save commit button taking to long to be clickable');
        closeSaveModalButton.click();
      });
  };

  this.moveToQuestionsTab = function() {
    questionsTabButton.click();
  };

  this.expectSubtopicPageContentsToMatch = function(contents) {
    var subtopicPageEditor = forms.RichTextEditor(
      pageEditor);
    expect(
      element.all(by.css('.oppia-rte')).first().getText()).toEqual(contents);
  };

  this.expectTitleOfSubtopicWithIndexToMatch = function(title, index) {
    subtopicTitles.then(function(elems) {
      expect(elems[index].getText()).toEqual(title);
    });
  };

  this.changeSubtopicTitle = function(title) {
    subtopicTitleField.clear();
    subtopicTitleField.sendKeys(title);
  };

  this.saveSubtopic = function() {
    saveSubtopicButton.click();
  };

  this.changeSubtopicPageContents = function(richTextInstructions) {
    var subtopicPageEditor = forms.RichTextEditor(
      pageEditor);
    subtopicPageEditor.clear();
    richTextInstructions(subtopicPageEditor);
  };

  this.editSubtopicWithIndex = function(index) {
    editSubtopicButtons.then(function(items) {
      items[index].click();
    });
  };

  this.expectNumberOfUncategorizedSkillsToBe = function(count) {
    uncategorizedSkillItems.then(function(items) {
      expect(items.length).toEqual(1);
    });
  };

  this.deleteSubtopicWithIndex = function(index) {
    deleteSubtopicButtons.then(function(items) {
      items[index].click();
    });
  };

  this.expectNumberOfSubtopicsToBe = function(count) {
    subtopics.then(function(items) {
      expect(items.length).toEqual(count);
    });
  };

  this.addSubtopic = function(title) {
    addSubtopicCard.click();
    newSubtopicTitlefield.sendKeys(title);
    waitFor.elementToBeClickable(
      confirmSubtopicCreationButton,
      'Confirm subtopic creation button takes too long to be clickable');
    confirmSubtopicCreationButton.click();
    waitFor.pageToFullyLoad();
  };

  this.dragSkillToSubtopic = function(skillIndex, subtopicIndex) {
    var target = subtopicTitles.get(subtopicIndex);
    var toMove = skillCards.get(skillIndex);
    dragAndDrop(toMove.getWebElement(), target.getWebElement());
  };

  this.dragSkillBetweenSubtopics = function(
      fromSubtopicIndex, skillCardIndex, toSubtopicIndex) {
    var subtopicCol = subtopicColumns.get(fromSubtopicIndex);
    skillNamesElems = subtopicCol.all(
      by.css('.protractor-test-assigned-skill-card-text'));
    var toMove = skillNamesElems.get(skillCardIndex);
    var target = subtopicColumns.get(toSubtopicIndex);
    dragAndDrop(toMove.getWebElement(), target.getWebElement());
  };

  this.dragSkillFromSubtopicToUncategorized = function(
      subtopicIndex, skillCardIndex) {
    var subtopicCol = subtopicColumns.get(subtopicIndex);
    skillNamesElems = subtopicCol.all(
      by.css('.protractor-test-assigned-skill-card-text'));
    var toMove = skillNamesElems.get(skillCardIndex);
    dragAndDrop(
      toMove.getWebElement(),
      uncategorizedSkillsContainer.getWebElement());
  };

  this.expectSubtopicToHaveSkills = function(subtopicIndex, skillNames) {
    var subtopicCol = subtopicColumns.get(subtopicIndex);
    skillNamesElems = subtopicCol.all(
      by.css('.protractor-test-assigned-skill-card-text'));
    skillNamesElems.each(function(skillCardTextElem, index) {
      var text = skillCardTextElem.getText();
      expect(skillNames[index]).toEqual(text);
    });
    expect(skillNamesElems.count()).toEqual(skillNames.length);
  };

  this.moveToSubtopicsTab = function() {
    subtopicsTabButton.click();
  };

  this.expectNumberOfStoriesToBe = function(count) {
    storyListItems.then(function(elems) {
      expect(elems.length).toEqual(count);
    });
  };

  this.expectStoryTitleToBe = function(title, index) {
    storyListItems.then(function(elems) {
      expect(
        elems[index].all(
          by.css('.protractor-test-story-title')).first().getText()
      ).toEqual(title);
    });
  };

  this.expectStoryPublicationStatusToBe = function(status, index) {
    storyListItems.then(function(elems) {
      expect(
        elems[index].all(
          by.css('.protractor-test-story-publication-status')).first().getText()
      ).toEqual(status);
    });
  };

  this.navigateToStoryWithIndex = function(index) {
    storyListItems.then(function(elems) {
      elems[index].click();
    });
    waitFor.pageToFullyLoad();
  };

  this.createStory = function(storyTitle) {
    waitFor.elementToBeClickable(
      createStoryButton,
      'Create Story button takes too long to be clickable');
    createStoryButton.click();

    newStoryTitleField.sendKeys(storyTitle);
    waitFor.elementToBeClickable(
      confirmStoryCreationButton,
      'Confirm Create Story button takes too long to be clickable');
    confirmStoryCreationButton.click();
    waitFor.pageToFullyLoad();
  };

  this.changeTopicName = function(newName) {
    topicNameField.clear();
    topicNameField.sendKeys(newName);
  };

  this.expectTopicNameToBe = function(name) {
    expect(topicNameField.getAttribute('value')).toEqual(name);
  };

  this.changeTopicDescription = function(newDescription) {
    topicDescriptionField.clear();
    topicDescriptionField.sendKeys(newDescription);
  };

  this.expectTopicDescriptionToBe = function(description) {
    expect(topicDescriptionField.getAttribute('value')).toEqual(description);
  };

  this.saveTopic = function(commitMessage) {
    waitFor.elementToBeClickable(
      saveTopicButton,
      'Save topic button takes too long to be clickable');
    saveTopicButton.click();
    commitMessageField.sendKeys(commitMessage);

    waitFor.elementToBeClickable(
      closeSaveModalButton,
      'Close save modal button takes too long to be clickable');
    closeSaveModalButton.click();
    waitFor.pageToFullyLoad();
  };
};

exports.TopicEditorPage = TopicEditorPage;
