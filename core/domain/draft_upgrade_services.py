# coding: utf-8
#
# Copyright 2019 The Oppia Authors. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS-IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Commands that can be used to upgrade draft to newer Exploration versions."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import logging

from core.domain import exp_domain
from core.platform import models
from core.domain import html_validation_service

import python_utils
import utils

(exp_models, feedback_models, user_models) = models.Registry.import_models([
    models.NAMES.exploration, models.NAMES.feedback, models.NAMES.user
])


def check_for_html_in_cust_args(value):
    print("*****************************************************\n")
    print(value)
    if value is not None:
        if 'choices' in value.keys():
            return True
        else:
            return False

def check_for_html_in_rule_specs_and_convert(rule_spec):
    if rule_spec['rule_type'] == 'HasElementXAtPositionY':
        rule_spec['inputs']['x'] = html_validation_service.add_math_content_to_math_rte_components(rule_spec['inputs']['x'])
    elif rule_spec['rule_type'] == "HasElementXBeforeElementY":
        rule_spec['inputs']['x'] = html_validation_service.add_math_content_to_math_rte_components(rule_spec['inputs']['x'])
        rule_spec['inputs']['y'] = html_validation_service.add_math_content_to_math_rte_components(rule_spec['inputs']['y'])
    elif rule_spec['rule_type'] == "IsEqualToOrdering":
        for value_index, value in enumerate(rule_spec['inputs']['x']):
            rule_spec['inputs']['x'][value_index][0] = html_validation_service.add_math_content_to_math_rte_components(value[0])
    elif rule_spec['rule_type'] == "IsEqualToOrderingWithOneItemAtIncorrectPosition":
        for value_index, value in enumerate(rule_spec['inputs']['x']):
            rule_spec['inputs']['x'][value_index][0] = html_validation_service.add_math_content_to_math_rte_components(value[0])
    elif rule_spec['rule_type'] == "Equals":
        if isinstance(rule_spec['inputs']['x'], list):
            for value_index, value in enumerate(rule_spec['inputs']['x']):
                rule_spec['inputs']['x'][value_index] = html_validation_service.add_math_content_to_math_rte_components(value)
    return rule_spec

def convert_html_fields_in_draft_change_list_customization_args(
                                                draft_change_list, conversion_fn):
    if check_for_html_in_cust_args(draft_change_list):
        for value_index, value in enumerate(
                draft_change_list['choices']['value']):
            draft_change_list['choices']['value'][value_index] = conversion_fn(value)
    return draft_change_list


def convert_html_fields_in_draft_change_list_answer_groups(
                                             draft_change_list,conversion_fn):
    for answer_group_index, answer_group in enumerate(
            draft_change_list):
        answer_group_html = answer_group['outcome']['feedback']['html']
        draft_change_list[answer_group_index]['outcome']['feedback']['html'] = (
                conversion_fn(answer_group_html))
        # we check whether the interaction type is ItemSelectionInput by passing
        # the rule_spec property to a helper function which returns a boolean.
        for rule_spec_index, rule_spec in enumerate(answer_group['rule_specs']):
            draft_change_list[answer_group_index]['rule_specs'][rule_spec_index] = check_for_html_in_rule_specs_and_convert(draft_change_list[answer_group_index]['rule_specs'][rule_spec_index])
    return draft_change_list


def try_upgrading_draft_to_exp_version(
        draft_change_list, current_draft_version, to_exp_version, exp_id):
    """Try upgrading a list of ExplorationChange domain objects to match the
    latest exploration version.

    For now, this handles the scenario where all commits between
    current_draft_version and to_exp_version migrate only the state schema.

    Args:
        draft_change_list: list(ExplorationChange). The list of
            ExplorationChange domain objects to upgrade.
        current_draft_version: int. Current draft version.
        to_exp_version: int. Target exploration version.
        exp_id: str. Exploration id.

    Returns:
        list(ExplorationChange) or None. A list of ExplorationChange domain
            objects after upgrade or None if upgrade fails.

    Raises:
        InvalidInputException. current_draft_version is greater than
            to_exp_version.
    """
    if current_draft_version > to_exp_version:
        raise utils.InvalidInputException(
            'Current draft version is greater than the exploration version.')
    if current_draft_version == to_exp_version:
        return

    exp_versions = list(
        python_utils.RANGE(current_draft_version + 1, to_exp_version + 1))
    commits_list = (
        exp_models.ExplorationCommitLogEntryModel.get_multi(
            exp_id, exp_versions))
    upgrade_times = 0
    while current_draft_version + upgrade_times < to_exp_version:
        commit = commits_list[upgrade_times]
        if (
                len(commit.commit_cmds) != 1 or
                commit.commit_cmds[0]['cmd'] !=
                exp_domain.CMD_MIGRATE_STATES_SCHEMA_TO_LATEST_VERSION):
            return
        conversion_fn_name = '_convert_states_v%s_dict_to_v%s_dict' % (
            commit.commit_cmds[0]['from_version'],
            commit.commit_cmds[0]['to_version'])
        if not hasattr(DraftUpgradeUtil, conversion_fn_name):
            logging.warning('%s is not implemented' % conversion_fn_name)
            return
        conversion_fn = getattr(DraftUpgradeUtil, conversion_fn_name)
        draft_change_list = conversion_fn(draft_change_list)
        upgrade_times += 1
    return draft_change_list





class DraftUpgradeUtil(python_utils.OBJECT):
    """Wrapper class that contains util functions to upgrade drafts."""

    @classmethod
    def _convert_states_v33_dict_to_v34_dict(cls, draft_change_list):
        for i, change in enumerate(draft_change_list):
            if (change.cmd == exp_domain.CMD_EDIT_STATE_PROPERTY and
                    change.property_name ==
                    exp_domain.STATE_PROPERTY_INTERACTION_ANSWER_GROUPS):
                draft_change_list[i] = exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                    'property_name': (
                        exp_domain.STATE_PROPERTY_INTERACTION_ANSWER_GROUPS),
                    'state_name': change.state_name,
                      'new_value':(
                               convert_html_fields_in_draft_change_list_answer_groups(
                                    change.new_value,
                                    html_validation_service.add_math_content_to_math_rte_components)),
                     'old_value':(
                               convert_html_fields_in_draft_change_list_answer_groups(
                                    change.old_value,
                                     html_validation_service.add_math_content_to_math_rte_components))
                })
            elif (change.cmd == exp_domain.CMD_EDIT_STATE_PROPERTY and
                    change.property_name ==
                    exp_domain.STATE_PROPERTY_INTERACTION_CUST_ARGS):
                draft_change_list[i] = exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                    'property_name': (
                              exp_domain.STATE_PROPERTY_INTERACTION_CUST_ARGS),
                    'state_name': change.state_name,
                    'new_value':(
                           convert_html_fields_in_draft_change_list_customization_args(
                                    change.new_value,
                                    html_validation_service.add_math_content_to_math_rte_components)),
                    'old_value':(
                           convert_html_fields_in_draft_change_list_customization_args(
                                    change.old_value,
                                     html_validation_service.add_math_content_to_math_rte_components))
                })
            elif (change.cmd == exp_domain.CMD_EDIT_STATE_PROPERTY and
                    change.property_name ==
                    exp_domain.STATE_PROPERTY_CONTENT):
                draft_change_list[i] = exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                    'property_name': (
                        exp_domain.STATE_PROPERTY_CONTENT),
                    'state_name': change.state_name,
                    'new_value':html_validation_service.add_math_content_to_math_rte_components(
                                    change.new_value),
                    'old_value':html_validation_service.add_math_content_to_math_rte_components(
                                    change.old_value)
                })

        return draft_change_list

    @classmethod
    def _convert_states_v32_dict_to_v33_dict(cls, draft_change_list):
        """Converts draft change list from state version 32 to 33. State
        version 33 adds showChoicesInShuffledOrder boolean variable to the
        MultipleChoiceInput interaction.

        Args:
            draft_change_list: list(ExplorationChange). The list of
                ExplorationChange domain objects to upgrade.

        Returns:
            list(ExplorationChange). The converted draft_change_list.
        """
        for i, change in enumerate(draft_change_list):
            if (change.cmd == exp_domain.CMD_EDIT_STATE_PROPERTY and
                    change.property_name ==
                    exp_domain.STATE_PROPERTY_INTERACTION_CUST_ARGS):
                if change.new_value.keys() == ['choices']:
                    change.new_value['showChoicesInShuffledOrder'] = {
                        'value': False
                    }
                    draft_change_list[i] = exp_domain.ExplorationChange({
                        'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                        'property_name': (
                            exp_domain.STATE_PROPERTY_INTERACTION_CUST_ARGS),
                        'state_name': change.state_name,
                        'new_value': change.new_value
                    })
        return draft_change_list

    @classmethod
    def _convert_states_v31_dict_to_v32_dict(cls, draft_change_list):
        """Converts draft change list from state version 31 to 32. State
        version 32 adds a customization arg for the "Add" button text
        in SetInput interaction, for which there should be no changes
        to drafts.

        Args:
            draft_change_list: list(ExplorationChange). The list of
                ExplorationChange domain objects to upgrade.

        Returns:
            list(ExplorationChange). The converted draft_change_list.
        """
        return draft_change_list

    @classmethod
    def _convert_states_v30_dict_to_v31_dict(cls, draft_change_list):
        """Converts draft change list from state version 30 to 31. State
        Version 31 adds the duration_secs float for the Voiceover
        section of state.

        Args:
            draft_change_list: list(ExplorationChange). The list of
                ExplorationChange domain objects to upgrade.

        Returns:
            list(ExplorationChange). The converted draft_change_list.
        """
        for i, change in enumerate(draft_change_list):
            if (change.cmd == exp_domain.CMD_EDIT_STATE_PROPERTY and
                    change.property_name ==
                    exp_domain.STATE_PROPERTY_RECORDED_VOICEOVERS):
                # Get the language code to access the language code correctly.
                new_voiceovers_mapping = change.new_value['voiceovers_mapping']
                # Initialize the value to migrate draft state to v31.
                language_codes_to_audio_metadata = (
                    new_voiceovers_mapping.values())
                for language_codes in language_codes_to_audio_metadata:
                    for audio_metadata in language_codes.values():
                        audio_metadata['duration_secs'] = 0.0
                draft_change_list[i] = exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                    'property_name': (
                        exp_domain.STATE_PROPERTY_RECORDED_VOICEOVERS),
                    'state_name': change.state_name,
                    'new_value': {
                        'voiceovers_mapping': new_voiceovers_mapping
                    }
                })
        return draft_change_list

    @classmethod
    def _convert_states_v29_dict_to_v30_dict(cls, draft_change_list):
        """Converts draft change list from state version 29 to 30. State
        version 30 replaces tagged_misconception_id with
        tagged_skill_misconception_id.

        Args:
            draft_change_list: list(ExplorationChange). The list of
                ExplorationChange domain objects to upgrade.

        Returns:
            list(ExplorationChange). The converted draft_change_list.
        """
        for i, change in enumerate(draft_change_list):
            if (change.cmd == exp_domain.CMD_EDIT_STATE_PROPERTY and
                    change.property_name ==
                    exp_domain.STATE_PROPERTY_INTERACTION_ANSWER_GROUPS):
                draft_change_list[i] = exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                    'property_name': (
                        exp_domain.STATE_PROPERTY_INTERACTION_ANSWER_GROUPS),
                    'state_name': change.state_name,
                    'new_value': {
                        'rule_specs': change.new_value['rule_specs'],
                        'outcome': change.new_value['outcome'],
                        'training_data': change.new_value['training_data'],
                        'tagged_skill_misconception_id': None
                    }
                })
        return draft_change_list

    @classmethod
    def _convert_states_v28_dict_to_v29_dict(cls, draft_change_list):
        """Converts draft change list from state version 28 to 29. State
        version 29 adds solicit_answer_details boolean variable to the
        state, for which there should be no changes to drafts.

        Args:
            draft_change_list: list(ExplorationChange). The list of
                ExplorationChange domain objects to upgrade.

        Returns:
            list(ExplorationChange). The converted draft_change_list.
        """
        return draft_change_list

    @classmethod
    def _convert_states_v27_dict_to_v28_dict(cls, draft_change_list):
        """Converts draft change list from state version 27 to 28. State
        version 28 replaces content_ids_to_audio_translations with
        recorded_voiceovers.

        Args:
            draft_change_list: list(ExplorationChange). The list of
                ExplorationChange domain objects to upgrade.

        Returns:
            list(ExplorationChange). The converted draft_change_list.
        """
        for i, change in enumerate(draft_change_list):
            if (change.cmd == exp_domain.CMD_EDIT_STATE_PROPERTY and
                    change.property_name ==
                    exp_domain.STATE_PROPERTY_CONTENT_IDS_TO_AUDIO_TRANSLATIONS_DEPRECATED):  # pylint: disable=line-too-long
                draft_change_list[i] = exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                    'property_name': (
                        exp_domain.STATE_PROPERTY_RECORDED_VOICEOVERS),
                    'state_name': change.state_name,
                    'new_value': {
                        'voiceovers_mapping': change.new_value
                    }
                })

        return draft_change_list
