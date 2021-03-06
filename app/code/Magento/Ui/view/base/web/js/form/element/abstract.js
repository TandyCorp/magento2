/**
 * Copyright © 2015 Magento. All rights reserved.
 * See COPYING.txt for license details.
 */

define([
    'underscore',
    'mageUtils',
    'uiLayout',
    'uiElement',
    'Magento_Ui/js/lib/validation/validator'
], function (_, utils, layout, Element, validator) {
    'use strict';

    return Element.extend({
        defaults: {
            visible: true,
            preview: '',
            focused: false,
            required: false,
            disabled: false,
            elementTmpl: 'ui/form/element/input',
            tooltipTpl: 'ui/form/element/helper/tooltip',
            'input_type': 'input',
            placeholder: '',
            description: '',
            label: '',
            error: '',
            warn: '',
            notice: '',
            customScope: '',
            additionalClasses: {},
            switcherConfig: {
                component: 'Magento_Ui/js/form/switcher',
                name: '${ $.name }_switcher',
                target: '${ $.name }',
                property: 'value'
            },
            listens: {
                visible: 'setPreview',
                '${ $.provider }:data.reset': 'reset',
                '${ $.provider }:data.overload': 'overload',
                '${ $.provider }:${ $.customScope ? $.customScope + "." : ""}data.validate': 'validate'
            },

            links: {
                value: '${ $.provider }:${ $.dataScope }'
            }
        },

        /**
         * Invokes initialize method of parent class,
         * contains initialization logic
         */
        initialize: function () {
            _.bindAll(this, 'reset');

            this._super()
                .setInitialValue()
                ._setClasses()
                .initSwicher();

            return this;
        },

        /**
         * Initializes observable properties of instance
         *
         * @returns {Abstract} Chainable.
         */
        initObservable: function () {
            var rules = this.validation = this.validation || {};

            this._super();

            this.observe('error disabled focused preview visible value warn')
                .observe({
                    'required': !!rules['required-entry']
                });

            return this;
        },

        /**
         * Initializes regular properties of instance.
         *
         * @returns {Abstract} Chainable.
         */
        initConfig: function () {
            var uid = utils.uniqueid(),
                name,
                scope;

            this._super();

            scope   = this.dataScope,
            name    = scope.split('.').slice(1);

            _.extend(this, {
                uid: uid,
                noticeId: 'notice-' + uid,
                inputName: utils.serializeName(name.join('.'))
            });

            return this;
        },

        /**
         * Initializes switcher element instance.
         *
         * @returns {Abstract} Chainable.
         */
        initSwicher: function () {
            if (this.switcherConfig.enabled) {
                layout([this.switcherConfig]);
            }

            return this;
        },

        /**
         * Sets initial value of the element and subscribes to it's changes.
         *
         * @returns {Abstract} Chainable.
         */
        setInitialValue: function () {
            this.initialValue = this.getInitialValue();

            if (this.value.peek() !== this.initialValue) {
                this.value(this.initialValue);
            }

            this.on('value', this.onUpdate.bind(this));

            return this;
        },

        /**
         * Extends 'additionalClasses' object.
         *
         * @returns {Abstract} Chainable.
         */
        _setClasses: function () {
            var additional = this.additionalClasses,
                classes;

            if (_.isString(additional) && additional.trim().length) {
                additional = this.additionalClasses.trim().split(' ');
                classes = this.additionalClasses = {};

                additional.forEach(function (name) {
                    classes[name] = true;
                }, this);
            }

            _.extend(this.additionalClasses, {
                _required: this.required,
                _error: this.error,
                _warn: this.warn,
                _disabled: this.disabled
            });

            return this;
        },

        /**
         * Gets initial value of element
         *
         * @returns {*} Elements' value.
         */
        getInitialValue: function () {
            var values = [this.value(), this.default],
                value;

            values.some(function (v) {
                return !utils.isEmpty(value = v);
            });

            return this.normalizeData(value);
        },

        /**
         * Sets 'value' as 'hidden' propertie's value, triggers 'toggle' event,
         * sets instance's hidden identifier in params storage based on
         * 'value'.
         *
         * @returns {Abstract} Chainable.
         */
        setVisible: function (isVisible) {
            this.visible(isVisible);

            return this;
        },

        /**
         * Show element.
         *
         * @returns {Abstract} Chainable.
         */
        show: function () {
            this.visible(true);

            return this;
        },

        /**
         * Hide element.
         *
         * @returns {Abstract} Chainable.
         */
        hide: function () {
            this.visible(false);

            return this;
        },

        /**
         * Disable element.
         *
         * @returns {Abstract} Chainable.
         */
        disable: function() {
            this.disabled(true);

            return this;
        },

        /**
         * Enable element.
         *
         * @returns {Abstract} Chainable.
         */
        enable: function() {
            this.disabled(false);

            return this;
        },

        /**
         *
         * @param {(String|Object)} rule
         * @param {(Object|Boolean)} [options]
         * @returns {Abstract} Chainable.
         */
        setValidation: function (rule, options) {
            var rules =  utils.copy(this.validation),
                changed;

            if (_.isObject(rule)) {
                _.extend(this.validation, rule)
            } else {
                this.validation[rule] = options;
            }

            changed = utils.compare(rules, this.validation).equal;

            if (changed) {
                this.required(!!rules['required-entry']);
                this.validate();
            }

            return this;
        },

        /**
         * Returnes unwrapped preview observable.
         *
         * @returns {String} Value of the preview observable.
         */
        getPreview: function () {
            return this.value();
        },

        /**
         * Checkes if element has addons
         *
         * @returns {Boolean}
         */
        hasAddons: function () {
            return this.addbefore || this.addafter;
        },

        /**
         * Defines if value has changed.
         *
         * @returns {Boolean}
         */
        hasChanged: function () {
            var notEqual = this.value() !== this.initialValue;

            return !this.visible() ? false : notEqual;
        },

        /**
         * Checks if 'value' is not empty.
         *
         * @returns {Boolean}
         */
        hasData: function () {
            return !utils.isEmpty(this.value());
        },

        /**
         * Sets value observable to initialValue property.
         */
        reset: function () {
            this.value(this.initialValue);
            this.error(false);
        },

        /**
         * Sets current state as initial.
         */
        overload: function () {
            this.setInitialValue();
            this.bubble('update', this.hasChanged());
        },

        /**
         * Clears 'value' property.
         *
         * @returns {Abstract} Chainable.
         */
        clear: function () {
            this.value('');

            return this;
        },

        /**
         * Converts values like 'null' or 'undefined' to an empty string.
         *
         * @param {*} value - Value to be processed.
         * @returns {*}
         */
        normalizeData: function (value) {
            return utils.isEmpty(value) ? '' : value;
        },

        /**
         * Validates itself by it's validation rules using validator object.
         * If validation of a rule did not pass, writes it's message to
         * 'error' observable property.
         *
         * @returns {Object} Validate information.
         */
        validate: function () {
            var value   = this.value(),
                result  = validator(this.validation, value),
                message = !this.disabled() && this.visible() ? result.message : '',
                isValid = this.disabled() || !this.visible() || result.passed;

            //TODO: Implement proper result propagation for form
            if (!isValid) {
                this.error(message);
                this.source.set('params.invalid', true);
            }

            return {
                valid: isValid,
                target: this
            };
        },

        /**
         * Callback that fires when 'value' property is updated.
         */
        onUpdate: function () {
            this.bubble('update', this.hasChanged());

            this.validate();
        }
    });
});
