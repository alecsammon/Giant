$oop.postpone($basicWidgets, 'Option', function (ns, cn) {
    "use strict";

    var base = $basicWidgets.Text,
        self = base.extend(cn)
            .addTraitAndExtend($basicWidgets.BinaryStateful)
            .addTraitAndExtend($basicWidgets.Disableable, 'Disableable')
            .addTraitAndExtend($basicWidgets.OptionPartial);

    /**
     * Creates a Option instance.
     * @name $basicWidgets.Option.create
     * @function
     * @returns {$basicWidgets.Option}
     */

    /**
     * A select option with static text inside.
     * @class
     * @extends $basicWidgets.Text
     * @extends $basicWidgets.BinaryStateful
     * @extends $basicWidgets.Disableable
     * @extends $basicWidgets.OptionPartial
     */
    $basicWidgets.Option = self
        .addMethods(/** @lends $basicWidgets.Option# */{
            /** @ignore */
            init: function () {
                base.init.call(this);
                $basicWidgets.BinaryStateful.init.call(this);
                $basicWidgets.Disableable.init.call(this);
                $basicWidgets.OptionPartial.init.call(this);
            },

            /** @ignore */
            afterAdd: function () {
                base.afterAdd.call(this);
                $basicWidgets.BinaryStateful.afterAdd.call(this);
                $basicWidgets.OptionPartial.afterAdd.call(this);
            },

            /** @ignore */
            afterRemove: function () {
                base.afterRemove.call(this);
                $basicWidgets.BinaryStateful.afterRemove.call(this);
            },

            /** @ignore */
            afterRender: function () {
                base.afterRender.call(this);
                $basicWidgets.OptionPartial.afterRender.call(this);
            },

            /** @ignore */
            afterStateOn: function () {
                $basicWidgets.Disableable.afterStateOn.call(this);
                $basicWidgets.OptionPartial.afterStateOn.call(this);
            },

            /** @ignore */
            afterStateOff: function () {
                $basicWidgets.Disableable.afterStateOff.call(this);
                $basicWidgets.OptionPartial.afterStateOff.call(this);
            }
        });
});
