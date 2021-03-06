$oop.postpone($widget, 'MarkupTemplate', function () {
    "use strict";

    var base = $oop.Base,
        self = base.extend();

    /**
     * Creates a MarkupTemplate instance.
     * MarkupTemplate instances may also be created via conversion from string.
     * @name $widget.MarkupTemplate.create
     * @function
     * @param {string} text MarkupTemplate string.
     * @returns {$widget.MarkupTemplate}
     * @see String#toMarkupTemplate
     */

    /**
     * Implements a template markup, where containers are identified by their CSS classes.
     * The template is filled in by specifying content for each container.
     * @class
     * @extends $oop.Base
     */
    $widget.MarkupTemplate = self
        .addConstants(/** @lends $widget.MarkupTemplate */{
            /**
             * Splits along template placeholders and tags.
             * Leaves an empty slot after each tag and placeholder in the resulting array.
             * @type {RegExp}
             * @constant
             */
            RE_MARKUP_SPLITTER: /(?=<)/,

            /**
             * Splits a tag to extract class list.
             * Extracted class list will be found in result[1].
             * @type {RegExp}
             * @constant
             */
            RE_CLASS_LIST_FROM_TAG: /class\s*=\s*"\s*([\w-]+(?:\s+[\w-]+)*)\s*"/,

            /**
             * Matches a class list.
             * Resulting array will contain extracted classes.
             * @type {RegExp}
             * @constant
             */
            RE_CLASS_FROM_CLASS_LIST: /[\w-]+/g
        })
        .addPrivateMethods(/** @lends $widget.MarkupTemplate */{
            /**
             * @param {string} tag
             * @returns {string}
             * @private
             */
            _extractClassListFromTag: function (tag) {
                var classNames = tag.split(self.RE_CLASS_LIST_FROM_TAG);
                return classNames && classNames[1];
            },

            /**
             * @param {string} classList
             * @returns {string[]}
             * @private
             */
            _extractClassesFromClassList: function (classList) {
                return classList.match(self.RE_CLASS_FROM_CLASS_LIST);
            },

            /**
             * @param {string} templateFragment
             * @returns {string|string[]}
             * @private
             */
            _processTemplateFragment: function (templateFragment) {
                var classList = this._extractClassListFromTag(templateFragment);
                return classList && this._extractClassesFromClassList(classList);
            }
        })
        .addMethods(/** @lends $widget.MarkupTemplate# */{
            /**
             * @param {string} templateString
             * @ignore
             */
            init: function (templateString) {
                /**
                 * Blown up string where the placeholders need to be substituted and joined to get the final text.
                 * @type {$data.Collection}
                 */
                this.preprocessedTemplate = templateString.split(self.RE_MARKUP_SPLITTER)
                    .toCollection();

                /**
                 * Defines lookup between container names and positions in the preprocessed template.
                 * @type {$data.StringDictionary}
                 */
                this.containerLookup = this.preprocessedTemplate
                    .mapValues(self._processTemplateFragment, this)
                    .toStringDictionary()
                    .reverse()
                    .toCollection()
                    .passEachItemTo(parseInt, this, 0, 10)
                    .setItem('undefined', this.preprocessedTemplate.getKeyCount() - 1);
            },

            /**
             * Appends template with specified content.
             * Do not call this on the original template. Clone first.
             * @param {object} parameterValues Pairs of container CSS classes & associated content.
             * @returns {$widget.MarkupTemplate}
             */
            setParameterValues: function (parameterValues) {
                var preprocessedTemplate = this.preprocessedTemplate.items,
                    containerLookup = this.containerLookup.items,
                    containerNames = Object.keys(parameterValues),
                    i, containerName, targetIndex;

                for (i = 0; i < containerNames.length; i++) {
                    // identifying placeholder in template
                    containerName = containerNames[i];
                    targetIndex = containerLookup[containerName];

                    if (targetIndex >= 0) {
                        // placeholder is found in template
                        preprocessedTemplate[targetIndex] += parameterValues[containerName];
                    }
                }

                return this;
            },

            /**
             * Sets template content and returns the resulting markup.
             * TODO: Break out a static MarkupTemplate, and make this one LiveMarkupTemplate.
             * @param {object} parameterValues Pairs of container CSS classes & associated content.
             * @returns {string}
             */
            getResolvedString: function (parameterValues) {
                return this.clone()
                    .setParameterValues(parameterValues)
                    .toString();
            },

            /**
             * Clones markup template.
             * @returns {$widget.MarkupTemplate}
             */
            clone: function () {
                var result = this.getBase().create('');
                result.preprocessedTemplate = this.preprocessedTemplate.clone();
                result.containerLookup = this.containerLookup.clone();
                return result;
            },

            /**
             * Serializes markup template.
             * @returns {string}
             */
            toString: function () {
                return this.preprocessedTemplate.items.join('');
            }
        });
});

(function () {
    "use strict";

    $oop.extendBuiltIn(String.prototype, /** @lends String# */{
        /**
         * Converts `String` to `MarkupTemplate` instance.
         * @returns {$widget.MarkupTemplate}
         */
        toMarkupTemplate: function () {
            return $widget.MarkupTemplate.create(this);
        }
    });
}());
