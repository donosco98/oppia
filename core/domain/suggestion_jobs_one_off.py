# coding: utf-8
#
# Copyright 2020 The Oppia Authors. All Rights Reserved.
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

"""One-off jobs for suggestions."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import ast
import logging

from core import jobs
from core.domain import html_validation_service
from core.domain import suggestion_services
from core.platform import models
import feconf

(suggestion_models,) = models.Registry.import_models([models.NAMES.suggestion])


class SuggestionMathRteAuditOneOffJob(jobs.BaseMapReduceOneOffJobManager):
    """Job that checks for existence of math components in the suggestions."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [suggestion_models.GeneralSuggestionModel]

    @staticmethod
    def map(item):
        suggestion = suggestion_services.get_suggestion_from_model(item)
        html_string_list = suggestion.get_all_html_content_strings()
        html_string = ''.join(html_string_list)
        if (
                html_validation_service.check_for_math_component_in_html(
                    html_string)):
            yield ('Suggestion with Math', item.id)

    @staticmethod
    def reduce(key, values):
        yield (
            '%d suggestions have Math components in them, with IDs: %s' % (
                len(values), values))


class SuggestionSvgFilenameValidationOneOffJob(
        jobs.BaseMapReduceOneOffJobManager):
    """Job that checks the html content of a suggestion and validates the
    svg_filename fields in each math rich-text components."""

    _ERROR_KEY = 'found-suggestion-with-invalid-math'
    _SUCCESS_KEY = 'suggestion-with-latex-strings-having-no-svg'
    @classmethod
    def entity_classes_to_map_over(cls):
        return [suggestion_models.GeneralSuggestionModel]

    @staticmethod
    def map(item):
        suggestion = suggestion_services.get_suggestion_from_model(item)
        html_string_list = suggestion.get_all_html_content_strings()
        html_string = ''.join(html_string_list)
        if suggestion.target_type == suggestion_models.TARGET_TYPE_EXPLORATION:
            error_list = (
                html_validation_service.
                validate_math_tags_in_html_with_attribute_math_content(
                    html_string))
            if len(error_list) > 0:
                yield (
                    SuggestionSvgFilenameValidationOneOffJob._ERROR_KEY,
                    item.id)
                return
            invalid_tags = (
                html_validation_service.
                validate_svg_filenames_in_math_rich_text(
                    feconf.ENTITY_TYPE_EXPLORATION, item.target_id,
                    html_string))
            if len(invalid_tags) > 0:
                yield (
                    SuggestionSvgFilenameValidationOneOffJob._SUCCESS_KEY,
                    (item.id, invalid_tags))


    @staticmethod
    def reduce(key, values):
        if key == SuggestionSvgFilenameValidationOneOffJob._SUCCESS_KEY:
            final_values = [ast.literal_eval(value) for value in values]
            no_of_invalid_tags = 0
            for suggestion_id, invalid_tags in final_values:
                no_of_invalid_tags += len(invalid_tags)
                yield (suggestion_id, invalid_tags)
            final_value_dict = {
                'no_of_suggestions_with_no_svgs': len(final_values),
                'no_of_invalid_tags': no_of_invalid_tags,
            }
            yield ('Overall result', final_value_dict)
        else:
            yield (key, values)


class SuggestionMathMigrationOneOffJob(jobs.BaseMapReduceOneOffJobManager):
    """A one-time job that can be used to migrate the Math components in the
    suggestions to the new Math Schema.
    """

    _ERROR_KEY_BEFORE_MIGRATION = 'validation_error'
    _ERROR_KEY_AFTER_MIGRATION = 'validation_error_after_migration'

    @classmethod
    def entity_classes_to_map_over(cls):
        return [suggestion_models.GeneralSuggestionModel]

    @staticmethod
    def map(item):
        suggestion = suggestion_services.get_suggestion_by_id(item.id)
        try:
            suggestion.validate()
        except Exception as e:
            logging.error(
                'Suggestion %s failed validation: %s' % (item.id, e))
            yield (
                SuggestionMathMigrationOneOffJob._ERROR_KEY_BEFORE_MIGRATION,
                'Suggestion %s failed validation: %s' % (item.id, e))
            return
        html_string_list = suggestion.get_all_html_content_strings()
        html_string = ''.join(html_string_list)
        error_list = (
            html_validation_service.
            validate_math_tags_in_html_with_attribute_math_content(html_string))
        # Migrate the suggestion only if the suggestions have math-tags with
        # old schema.
        if len(error_list) > 0:
            suggestion.convert_html_in_suggestion_change(
                html_validation_service.add_math_content_to_math_rte_components)
            try:
                suggestion.validate()
            except Exception as e:
                logging.error(
                    'Suggestion %s failed validation after migration: %s' % (
                        item.id, e))
                yield (
                    SuggestionMathMigrationOneOffJob._ERROR_KEY_AFTER_MIGRATION,
                    'Suggestion %s failed validation: %s' % (
                        item.id, e))
                return
            item.change_cmd = suggestion.change.to_dict()
            item.put(update_last_updated_time=False)
            yield ('suggestion_migrated', 1)

    @staticmethod
    def reduce(key, values):
        if key not in [
                SuggestionMathMigrationOneOffJob._ERROR_KEY_AFTER_MIGRATION,
                SuggestionMathMigrationOneOffJob._ERROR_KEY_BEFORE_MIGRATION]:
            no_of_suggestions_migrated = (
                sum(ast.literal_eval(v) for v in values))
            yield (key, ['%d suggestions successfully migrated.' % (
                no_of_suggestions_migrated)])
        else:
            yield (key, values)
