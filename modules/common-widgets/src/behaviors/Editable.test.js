(function () {
    "use strict";

    module("Editable");

    var base = $widget.Widget,
        Editable = base.extend('Editable')
            .addTraitAndExtend($commonWidgets.BinaryStateful)
            .addTraitAndExtend($commonWidgets.Editable)
            .addMethods({
                init: function () {
                    base.init.call(this);
                    $commonWidgets.BinaryStateful.init.call(this);
                    $commonWidgets.Editable.init.call(this);
                },

                afterAdd: function () {
                    base.afterAdd.call(this);
                    $commonWidgets.BinaryStateful.afterAdd.call(this);
                },

                afterRemove: function () {
                    base.afterRemove.call(this);
                    $commonWidgets.BinaryStateful.afterRemove.call(this);
                }
            });

    test("Instantiation", function () {
        Editable.addMocks({
            addBinaryState: function (stateName) {
                equal(stateName, $commonWidgets.Editable.STATE_NAME_EDITABLE,
                    "should add editable state to instance");
            }
        });

        Editable.create();

        Editable.removeMocks();
    });

    test("State on handler", function () {
        expect(1);

        var editable = Editable.create();

        editable.addMocks({
            _updateEditableState: function () {
                ok(true, "should update editable state");
            }
        });

        editable.afterStateOn('foo');

        editable.afterStateOn($commonWidgets.Editable.STATE_NAME_EDITABLE);
    });

    test("State off handler", function () {
        expect(1);

        var disableable = Editable.create();

        disableable.addMocks({
            _updateEditableState: function () {
                ok(true, "should update editable state");
            }
        });

        disableable.afterStateOff('foo');

        disableable.afterStateOff($commonWidgets.Editable.STATE_NAME_EDITABLE);
    });

    test("Switching to edit mode", function () {
        expect(3);

        var editable = Editable.create();

        editable.addMocks({
            addBinaryStateSource: function (stateName, sourceId) {
                equal(stateName, $commonWidgets.Editable.STATE_NAME_EDITABLE,
                    "should add to state by specified name");
                equal(sourceId, 'default', "should pass default source ID to state");
            }
        });

        strictEqual(editable.toEditMode(), editable, "should be chainable");
    });

    test("Switching to display mode", function () {
        expect(3);

        var editable = Editable.create();

        editable.addMocks({
            removeBinaryStateSource: function (stateName, sourceId) {
                equal(stateName, $commonWidgets.Editable.STATE_NAME_EDITABLE,
                    "should remove from state by specified name");
                equal(sourceId, 'default', "should pass default source ID to state");
            }
        });

        strictEqual(editable.toDisplayMode(), editable, "should be chainable");
    });

    test("Edit mode tester", function () {
        var editable = Editable.create();

        ok(!editable.isInEditMode(), "should return false by default");

        editable.toEditMode();

        ok(editable.isInEditMode(), "should return true after switching to edit mode");

        editable.toDisplayMode();

        ok(!editable.isInEditMode(), "should return false after switching to display mode");
    });
}());
