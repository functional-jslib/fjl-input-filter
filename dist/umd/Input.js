'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.Input = exports.toInputValidationResult = exports.toInput = exports.runIOFilters = exports.runFilters = exports.runIOValidators = exports.runValidators = exports.validateIOInput = exports.validateInput = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * Created by Ely on 7/24/2014.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * @module Input
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      */


var _fjlMutable = require('fjl-mutable');

var _fjl = require('fjl');

var _fjlValidator = require('fjl-validator');

var _Utils = require('./Utils');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/*---------------------------------------------------*/
/* VIRTUAL TYPES AND INTERFACES */
/*---------------------------------------------------*/
/**
 * @interface InputValidationResult
 * @memberOf module:fjlInputFilter
 * @property {String} name - `#Input` this result was generated with.
 * @property {Boolean} result - Result of validation.
 * @property {Array} messages - Any error messages if `result` is `false`.
 * @property {*} value=null - Value tested against (if `filters` exist on given `#Input` object the `value` is what is returned from the results of running filters on value).
 * @property {*} rawValue=null - Raw value tested against.
 * @property {*} obscuredValue=null - Obscured value if validation `result` is `true`.
 * @property {*} filteredValue=null - Filtered result if validation `result` is `true`.
 */

/**
 * @interface InputOptions
 * @memberOf module:fjlInputFilter
 * @desc Contains rules for validating and/or filtering an input.
 * @property {String} name='' - Input's name.
 * @property {Boolean} required=false - Whether input is required or not.
 * @property {Array} filters=[] - Any filter functions to apply to value.
 * @property {Array} validators=[] - Any validators to validate against for given value (to validator).
 * @property {Boolean} breakOnFailure=false - Whether or not to 'break' on a validation failure result or not.
 * @property {Boolean} valueObscured=false - Whether to obscure the value being tested against (to the assigned places) or not).
 * @property {Function} valueObscurator=((x) => x) - Obscurator used for obscuring a value given to validation.
 */

var

/**
 * Validates an input object based.
 * @function module:fjlInputFilter
 * @param input {Input|InputOptions}
 * @param value {*}
 * @returns {InputValidationResult}
 */
validateInput = exports.validateInput = function validateInput(input, value) {
    var validators = input.validators,
        filters = input.filters,
        breakOnFailure = input.breakOnFailure,
        valueObscured = input.valueObscured,
        valueObscurator = input.valueObscurator,
        name = input.name,
        vResult = runValidators(validators, breakOnFailure, value),
        fResult = runFilters(filters, value),
        oResult = valueObscured && valueObscurator ? valueObscurator(fResult) : fResult;

    return toInputValidationResult((0, _fjl.assign)(vResult, {
        name: name || '',
        rawValue: value,
        value: fResult,
        filteredValue: fResult,
        obscuredValue: oResult
    }));
},


/**
 * Validates an input object that may have IOValidators.  Returns
 * a validation result wrapped in a promise.
 * @function module:fjlInputFilter
 * @param input {Input|InputOptions}
 * @param value {*}
 * @returns {Promise.<InputValidationResult>}
 */
validateIOInput = exports.validateIOInput = function validateIOInput(input, value) {
    var validators = input.validators,
        filters = input.filters,
        breakOnFailure = input.breakOnFailure,
        valueObscured = input.valueObscured,
        valueObscurator = input.valueObscurator,
        pendingValidation = validators && validators.length ? runIOValidators(validators, breakOnFailure, value, input) : Promise.resolve({ result: true });

    return pendingValidation.then(function (result) {
        return runIOFilters(filters, value).then(function (filteredValue) {
            result.rawValue = value;
            result.value = result.filteredValue = filteredValue;
            result.obscuredValue = valueObscured && valueObscurator ? valueObscurator(filteredValue) : filteredValue;
            return toInputValidationResult(result);
        });
    });
},


/**
 * Runs validator against given `value`.
 * @function module:fjlInputFilter
 * @param validators {Array.<Function>}
 * @param breakOnFailure {Boolean}
 * @param value {*}
 * @returns {*}
 */
runValidators = exports.runValidators = function runValidators(validators, breakOnFailure, value) {
    var result = true,
        i = 0,
        messageResults = [];
    if (!validators || !validators.length) {
        return (0, _fjlValidator.toValidationResult)({ result: result });
    }
    var limit = validators.length;
    for (; i < limit; i++) {
        var vResult = validators[i](value);
        if (!vResult.result) {
            messageResults.push(vResult.messages);
            result = false;
            if (breakOnFailure) {
                break;
            }
        }
    }
    return (0, _fjlValidator.toValidationResult)({ result: result, messages: (0, _fjl.concat)(messageResults) });
},


/**
 * Runs (possibly) IOValidators against given `value`.
 * @function module:fjlInputFilter.runIOValidators
 * @param validators {Array.<Function>}
 * @param breakOnFailure {Boolean}
 * @param value {*}
 * @param [errorCallback=console.error] {Function}
 * @returns {*}
 */
runIOValidators = exports.runIOValidators = function runIOValidators(validators, breakOnFailure, value) {
    var errorCallback = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : _Utils.defaultErrorHandler;

    if (!validators || !validators.length) {
        return Promise.resolve((0, _fjlValidator.toValidationResult)({ result: true }));
    }
    var limit = validators.length,
        pendingResults = [];
    var i = 0,
        result = true;
    for (; i < limit; i++) {
        var validator = validators[i],
            vResult = validator(value);
        if (vResult instanceof Promise) {
            pendingResults.push(vResult.catch(errorCallback));
            continue;
        }
        pendingResults.push(vResult);
        if (!vResult.result) {
            result = false;
            if (breakOnFailure) {
                break;
            }
        }
    }

    return Promise.all(pendingResults).then(function (results) {
        var failedResults = results.filter(function (rslt) {
            return !rslt.result;
        }),
            interimResult = {
            result: result,
            messages: failedResults.reduce(function (agg, item) {
                agg = agg.concat(item.messages);
                return agg;
            }, [])
        };
        if (failedResults.length) {
            interimResult.result = false;
        }
        return (0, _fjlValidator.toValidationResult)(interimResult);
    }).catch(errorCallback);
},


/**
 * Runs filters on value (successively).
 * @function module:fjlInputFilter.runFilters
 * @param filters {Array.<Function>}
 * @param value {*}
 * @returns {*}
 */
runFilters = exports.runFilters = function runFilters(filters, value) {
    return filters && filters.length ? (0, _fjl.apply)(_fjl.compose, filters)(value) : value;
},


/**
 * Runs filters on value (successively) and returns result wrapped in a promise.
 * @function module:fjlInputFilter.runIOFilters
 * @param filters {Array.<Function>}
 * @param value {*}
 * @param [errorCallback=console.error] {Function}
 * @returns {Promise.<*>}
 */
runIOFilters = exports.runIOFilters = function runIOFilters(filters, value) {
    var errorCallback = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : _Utils.defaultErrorHandler;
    return runFilters(filters ? filters.map(function (filter) {
        return function (x) {
            return x.then(filter);
        };
    }) : null, Promise.resolve(value).catch(errorCallback));
},


/**
 * Returns an `InputOptions` object from given object and optionally turns the `out` object into
 * said `InputOptions` with firstParam assigned on top of it.
 * @function module:fjlInputFilter.toInput
 * @param inputObj {Object|*} - Object to build `InputOptions` object from.
 * @param [out = {}] {Object|*}
 * @returns {InputOptions}
 */
toInput = exports.toInput = function toInput(inputObj) {
    var out = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    var _inputObj = (0, _fjlMutable.defineEnumProps$)([[String, 'name', ''], [Boolean, 'required', false], [Array, 'filters', []], [Array, 'validators', []], [Boolean, 'breakOnFailure', false]], (0, _fjlValidator.toValidationOptions)(out));
    if ((0, _fjl.isString)(inputObj)) {
        _inputObj.name = inputObj;
    } else if (inputObj) {
        (0, _fjl.assign)(_inputObj, inputObj);
    }
    if (_inputObj.required) {
        _inputObj.validators.push((0, _fjlValidator.notEmptyValidator)(null));
    }
    return _inputObj;
},


/**
 * Returns an input validation result object with values of given object
 * applied/assigned to it.
 * @function module:fjlInputFilter.toInputValidationResult
 * @param resultObj {Object|*}
 * @returns {InputValidationResult}
 */
toInputValidationResult = exports.toInputValidationResult = function toInputValidationResult(resultObj) {
    var _result = (0, _fjlMutable.defineEnumProps$)([[String, 'name', ''], [Boolean, 'result', false], [Array, 'messages', []]], {
        value: null,
        rawValue: null,
        obscuredValue: null,
        filteredValue: null
    });
    return (0, _fjl.assign)(_result, resultObj);
};

/**
 * @memberOf module:fjlInputFilter
 * @class Input
 * @extends InputOptions
 */

var Input = exports.Input = function () {
    function Input(inputObj) {
        _classCallCheck(this, Input);

        toInput(inputObj, this);
    }

    _createClass(Input, [{
        key: 'validate',
        value: function validate(value) {
            return validateInput(this, value);
        }
    }, {
        key: 'validateIO',
        value: function validateIO(value) {
            return validateIOInput(this, value);
        }
    }], [{
        key: 'of',
        value: function of(inputObj) {
            return new Input(inputObj);
        }
    }]);

    return Input;
}();