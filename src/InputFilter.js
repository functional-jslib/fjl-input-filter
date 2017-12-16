/**
 * Created by elydelacruz on 5/21/16.
 * @todo refactor input filter to not require `alias`es for Input configs unless method requires it.
 */
(function () {

    'use strict';

    var isNodeEnv = typeof window === 'undefined',
        sjl = isNodeEnv ? require('../fjlInputFilter.js') : window.sjl || {},
        Input = sjl.input.Input,
        contextName = 'sjl.input.InputFilter',
        validateNonEmptyKey = function (key, methodName) {
            sjl.throwTypeErrorIfEmpty(contextName + '.' + methodName, 'key', key, String);
        },
        InputFilter = function InputFilter(options) {
            var _data = {},
                _inputs = {},
                _invalidInputs = {},
                _validInputs = {},
                _messages = {};

            Object.defineProperties(this, {
                data: {
                    get: function () {
                        return _data;
                    },
                    set: function (value) {
                        sjl.throwTypeErrorIfNotOfType(contextName, 'data', value, Object);
                        _data = value;
                        this._setDataOnInputs(_data, _inputs);
                    },
                    enumerable: true
                },
                inputs: {
                    get: function () {
                        return _inputs;
                    },
                    set: function (value) {
                        sjl.throwTypeErrorIfNotOfType(contextName, 'inputs', value, Object);
                        if (sjl.empty(value)) {
                            _inputs = {};
                        }
                        _inputs = this._setInputsOnInputs(value, _inputs);
                    },
                    enumerable: true
                },
                invalidInputs: {
                    get: function () {
                        return _invalidInputs;
                    },
                    set: function (value) {
                        sjl.throwTypeErrorIfNotOfType(contextName, 'invalidInputs', value, Object);
                        _invalidInputs = value;
                    },
                    enumerable: true
                },
                validInputs: {
                    get: function () {
                        return _validInputs;
                    },
                    set: function (value) {
                        sjl.throwTypeErrorIfNotOfType(contextName, 'validInputs', value, Object);
                        _validInputs = value;
                    },
                    enumerable: true
                },
                messages: {
                    get: function () {
                        return _messages;
                    },
                    set: function (value) {
                        sjl.throwTypeErrorIfNotOfType(contextName, 'messages', value, Object);
                        _messages = value;
                    },
                    enumerable: true
                }
            });

            if (sjl.isObject(options)) {
                sjl.extend(this, options);
            }
        };

    InputFilter = sjl.stdlib.Extendable.extend(InputFilter, {

        addInput: function (input) {
            return this._addInputOnInputs(input, this.inputs);
        },

        addInputs: function (inputs) {
            sjl.throwTypeErrorIfEmpty(contextName + '.addInputs', 'inputs', inputs, Object);
            this._setInputsOnInputs(inputs, this.inputs);
            return this;
        },

        getInput: function (key) {
            validateNonEmptyKey(key, 'get');
            return this.inputs[key];
        },

        hasInput: function (key) {
            validateNonEmptyKey(key, 'get');
            return this.isInput(this.inputs[key]);
        },

        isInput: function (input) {
            return input instanceof Input;
        },

        removeInput: function (key) {
            var inputs = this.inputs,
                retVal;
            if (inputs.hasOwnProperty(key)) {
                retVal = inputs[key];
                sjl.unset(inputs, key);
            }
            return retVal;
        },

        isValid: function () {
            var self = this;

            self.clearInvalidInputs()
                .clearValidInputs()
                .clearMessages();

            // If no data bail and throw an error
            if (sjl.empty(self.inputs)) {
                throw new Error(contextName + '.isValid could\'nt ' +
                    'find any inputs to validate.  Set the `.inputs` property.');
            }
            else if (sjl.empty(self.data)) {
                throw new Error(contextName + '.isValid could\'nt ' +
                    'find any data for validation.  Set the data on `.data` property.');
            }

            // Set data on inputs and validate inputs
            return self._validateInputs();
        },

        validate: function () {
            return this.isValid.apply(this, arguments);
        },

        filter: function () {
            return this._filterInputs();
        },

        getRawValues: function () {
            var self = this,
                rawValues = {};
            sjl.forEachInObj(self.inputs, function (input, key) {
                if (!self.invalidInputs.hasOwnProperty(key)) {
                    rawValues[key] = input.rawValue;
                }
            });
            return rawValues;
        },

        getValues: function () {
            var self = this,
                values = {};
            sjl.forEachInObj(self.inputs, function (input, key) {
                if (!self.invalidInputs.hasOwnProperty(key)) {
                    values[key] = input.value;
                }
            });
            return values;
        },

        getMessages: function () {
            var self = this,
                messages = self.messages;
            sjl.forEachInObj(this.invalidInputs, function (input) {
                var messageItem;
                if (sjl.notEmptyAndOfType(input, Input)) {
                    messageItem = messages[input.alias];
                }
                if (messageItem) {
                    messages[input.alias] = messageItem.concat(input.messages);
                }
                else {
                    messages[input.alias] = input.messages;
                }
            });
            return messages;
        },

        mergeMessages: function (messages) {
            sjl.throwTypeErrorIfNotOfType(contextName + '.mergeMessages', 'messages', messages, Object);
            Object.keys(messages).forEach(function (key) {
                this.messages[key] = messages[key].concat(sjl.isset(this.messages[key]) ? this.messages[key] : []);
            }, this);
            return this;
        },

        clearMessages: function () {
            this.messages = {};
            return this;
        },

        clearValidInputs: function () {
            this.validInputs = {};
            return this;
        },

        clearInputs: function () {
            this.inputs = {};
            return this;
        },

        clearInvalidInputs: function () {
            this.invalidInputs = {};
            return this;
        },

        _addInputOnInputs: function (input, inputs) {
            if (this.isInput(input)) {
                inputs[input.alias] = input;
            }
            else if (sjl.isObject(input)) {
                inputs[input.alias] = this._inputHashToInput(input);
            }
            else {
                throw new TypeError(contextName + '._addInputOnInputs expects ' +
                    'param 1 to be of type `Object` or `Input`.  Type received: ' +
                    '`' + sjl.classOf(input) + '`.');
            }
            return this;
        },

        _setDataOnInputs: function (data, inputs) {
            sjl.throwTypeErrorIfNotOfType(contextName + '._setDataOnInputs', 'data', data, Object);
            sjl.throwTypeErrorIfNotOfType(contextName + '._setDataOnInputs', 'inputs', inputs, Object);
            Object.keys(data).forEach(function (key) {
                inputs[key].rawValue = data[key];
            });
            return inputs;
        },

        _setInputsOnInputs: function (inputs, inputsOn) {
            // Loop through incoming inputs
            sjl.forEachInObj(inputs, function (input, key) {
                input.alias = key;
                this._addInputOnInputs(input, inputsOn);
            }, this);

            // Return this
            return inputsOn;
        },

        _inputHashToInput: function (inputHash) {
            sjl.throwTypeErrorIfEmpty(contextName + '_inputHashToInput', 'inputHash.alias', inputHash.alias, String);
            return new Input(inputHash);
        },

        _validateInput: function (input, dataMap) {
            dataMap = dataMap || this.data;
            var name = input.alias,
                dataExists = sjl.isset(dataMap[name]),
                data = dataExists ? dataMap[name] : null,
                required = input.required,
                allowEmpty = input.allowEmpty,
                continueIfEmpty = input.continueIfEmpty,
                retVal = true;

            if (dataExists) {
                input.rawValue = dataMap[name];
            }

            // If data doesn't exists and input is not required
            if (!dataExists && !required) {
                retVal = true;
            }

            // If data doesn't exist, input is required, and input allows empty value,
            // then input is valid only if continueIfEmpty is false;
            else if (!dataExists && required && allowEmpty && continueIfEmpty) {
                retVal = true;
            }

            // If data exists, is empty, and not required
            else if (dataExists && sjl.empty(data) && !required) {
                retVal = true;
            }

            // If data exists, is empty, is required, and allows empty,
            // then input is valid if continue if empty is false
            else if (dataExists && sjl.empty(data) && required
                && allowEmpty && !continueIfEmpty) {
                retVal = true;
            }

            else if (!input.isValid()) {
                retVal = false;
            }

            return retVal;
        },

        _validateInputs: function (inputs, data) {
            data = data || this.data;
            inputs = inputs || this.inputs;
            var self = this;

            // Validate inputs
            sjl.forEach(inputs, function (input, key) {
                sjl.throwTypeErrorIfNotOfType(contextName + '._validateInputs', 'inputs[input]', input, Input);
                if (self._validateInput(input, data)) {
                    self.validInputs[key] = input;
                }
                else {
                    self.invalidInputs[key] = input;
                }
            });

            // If no invalid inputs then validation passed
            return sjl.empty(self.invalidInputs);
        },

        _filterInputs: function () {
            sjl.forEach(this.inputs, function (input) {
                this._filterInput(input);
            }, this);
            return this;
        },

        _filterInput: function (input) {
            input.value =
                input.filteredValue =
                    input.filter();
            return input;
        },

        _validatorsFromInputHash: function (inputHash) {
            return Array.isArray(inputHash.validators, Array) ? inputHash.validators : null;
        },

        _filtersFromInputHash: function (inputHash) {
            return Array.isArray(inputHash.filters, Array) ? inputHash.filters: null;
        }

    });

    if (isNodeEnv) {
        module.exports = InputFilter;
    }
    else {
        sjl.ns('input.InputFilter', InputFilter);
        if (window.__isAmd) {
            return InputFilter;
        }
    }

})();
