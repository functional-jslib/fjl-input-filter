(function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(["exports", "fjl", "fjl-validator", "./Utils"], factory);
  } else if (typeof exports !== "undefined") {
    factory(exports, require("fjl"), require("fjl-validator"), require("./Utils"));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod.exports, global.fjl, global.fjlValidator, global.Utils);
    global.Input = mod.exports;
  }
})(typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : this, function (_exports, _fjl, _fjlValidator, _Utils) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.Input = _exports.toInputValidationResult = _exports.toInput = _exports.runIOFilters = _exports.runFilters = _exports.runIOValidators = _exports.runValidators = _exports.validateIOInput = _exports.validateInput = _exports.noValidationRequired = void 0;

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

  function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

  /*---------------------------------------------------*/

  /* VIRTUAL TYPES AND INTERFACES */

  /*---------------------------------------------------*/

  /**
   * @interface InputValidationResult
   * @memberOf fjlInputFilter
   * @property {String} name - `Input` this result was generated with.
   * @property {Boolean} result - Result of validation.
   * @property {Array} messages - Any error messages if `result` is `false`.
   * @property {*} value=null - Value tested against (if `filters` exist on given `#Input` object the `value` is what is returned from the results of running filters on value).
   * @property {*} rawValue=null - Raw value tested against.
   * @property {*} obscuredValue=null - Obscured value if validation `result` is `true`.
   * @property {*} filteredValue=null - Filtered result if validation `result` is `true`.
   */

  /**
   * @interface InputOptions
   * @memberOf fjlInputFilter
   * @desc Contains rules for validating and/or filtering an input.
   * @property {String} name='' - Input's name.
   * @property {Boolean} required=false - Whether input is required or not.
   * @property {Array} filters=[] - Any filter functions to apply to value.
   * @property {Array} validators=[] - Any validators to validate against for given value (to validator).
   * @property {Boolean} breakOnFailure=false - Whether or not to 'break' on a validation failure result or not.
   * @property {Boolean} valueObscured=false - Whether to obscure the value being tested against (to the assigned places) or not).
   * @property {Function} valueObscurator=((x) => x) - Obscurator used for obscuring a value given to validation.
   */
  var noValidationRequired = function noValidationRequired(input, value) {
    return !input.required && (!(0, _fjl.isset)(value) || ((0, _fjl.isString)(value) || (0, _fjl.isArray)(value)) && !value.length);
  },

  /**
   * Validates an input object based.
   * @function module:fjlInputFilter.validateInput
   * @param input {Input|InputOptions}
   * @param value {*}
   * @returns {InputValidationResult}
   */
  validateInput = function validateInput(input, value) {
    var validators = input.validators,
        filters = input.filters,
        breakOnFailure = input.breakOnFailure,
        valueObscured = input.valueObscured,
        valueObscurator = input.valueObscurator,
        name = input.name; // If value is not required and is `null` or `undefined`

    if (noValidationRequired(input, value)) {
      return toInputValidationResult({
        result: true,
        name: name || '',
        rawValue: value,
        value: value,
        filteredValue: value,
        obscuredValue: value
      });
    } // Run validation and filtering


    var vResult = runValidators(validators, breakOnFailure, value),
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
   * @function module:fjlInputFilter.validateIOInput
   * @param input {Input|InputOptions}
   * @param value {*}
   * @returns {Promise.<InputValidationResult>}
   */
  validateIOInput = function validateIOInput(input, value) {
    var validators = input.validators,
        filters = input.filters,
        breakOnFailure = input.breakOnFailure,
        valueObscured = input.valueObscured,
        valueObscurator = input.valueObscurator; // If not required and value is `null` or `undefined` return truthy result

    if (noValidationRequired(input, value)) {
      return Promise.resolve(toInputValidationResult({
        result: true,
        name: input.name || '',
        rawValue: value,
        value: value,
        filteredValue: value,
        obscuredValue: value
      }));
    }

    var pendingValidation = validators && validators.length ? runIOValidators(validators, breakOnFailure, value, input) : Promise.resolve({
      result: true
    });
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
   * @function module:fjlInputFilter.runValidators
   * @param validators {Array.<Function>}
   * @param breakOnFailure {Boolean}
   * @param value {*}
   * @returns {*}
   */
  runValidators = function runValidators(validators, breakOnFailure, value) {
    var result = true,
        i = 0,
        messageResults = [];

    if (!validators || !validators.length) {
      return (0, _fjlValidator.toValidationResult)({
        result: result
      });
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

    return (0, _fjlValidator.toValidationResult)({
      result: result,
      messages: (0, _fjl.concat)(messageResults)
    });
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
  runIOValidators = function runIOValidators(validators, breakOnFailure, value) {
    var errorCallback = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : _Utils.defaultErrorHandler;

    if (!validators || !validators.length) {
      return Promise.resolve((0, _fjlValidator.toValidationResult)({
        result: true
      }));
    }

    var limit = validators.length,
        pendingResults = [];
    var i = 0,
        result = true;

    for (; i < limit; i++) {
      var validator = validators[i],
          vResult = validator(value);

      if (vResult instanceof Promise) {
        pendingResults.push(vResult["catch"](errorCallback));
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
          return agg.concat(item.messages);
        }, [])
      };

      if (failedResults.length) {
        interimResult.result = false;
      }

      return (0, _fjlValidator.toValidationResult)(interimResult);
    })["catch"](errorCallback);
  },

  /**
   * Runs filters on value (successively).
   * @function module:fjlInputFilter.runFilters
   * @param filters {Array.<Function>}
   * @param value {*}
   * @returns {*}
   */
  runFilters = function runFilters(filters, value) {
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
  runIOFilters = function runIOFilters(filters, value) {
    var errorCallback = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : _Utils.defaultErrorHandler;
    return runFilters(filters ? filters.map(function (filter) {
      return function (x) {
        return x.then(filter);
      };
    }) : null, Promise.resolve(value)["catch"](errorCallback));
  },

  /**
   * Returns an `InputOptions` object from given object and optionally turns the `out` object into
   * said `InputOptions` with firstParam assigned on top of it.
   * @function module:fjlInputFilter.toInput
   * @param inputObj {Object|*} - Object to build `InputOptions` object from.
   * @param [out = {}] {Object|*}
   * @returns {InputOptions}
   */
  toInput = function toInput(inputObj) {
    var out = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    var _inputObj = (0, _fjl.defineEnumProps)([[String, 'name', ''], [Boolean, 'required', false], [Array, 'filters', []], [Array, 'validators', []], [Boolean, 'breakOnFailure', false]], (0, _fjlValidator.toValidationOptions)(out));

    if ((0, _fjl.isString)(inputObj)) {
      _inputObj.name = inputObj;
    } else if (inputObj) {
      (0, _fjl.assign)(_inputObj, inputObj);
    }

    if (_inputObj.required) {
      _inputObj.validators = _inputObj.validators.slice(0);

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
  toInputValidationResult = function toInputValidationResult(resultObj) {
    var _result = (0, _fjl.defineEnumProps)([[String, 'name', ''], [Boolean, 'result', false], [Array, 'messages', []]], {
      value: null,
      rawValue: null,
      obscuredValue: null,
      filteredValue: null
    });

    return (0, _fjl.assign)(_result, resultObj);
  };
  /**
   * @memberOf fjlInputFilter
   * @class Input
   * @extends InputOptions
   */


  _exports.toInputValidationResult = toInputValidationResult;
  _exports.toInput = toInput;
  _exports.runIOFilters = runIOFilters;
  _exports.runFilters = runFilters;
  _exports.runIOValidators = runIOValidators;
  _exports.runValidators = runValidators;
  _exports.validateIOInput = validateIOInput;
  _exports.validateInput = validateInput;
  _exports.noValidationRequired = noValidationRequired;

  var Input = /*#__PURE__*/function () {
    function Input(inputObj) {
      _classCallCheck(this, Input);

      toInput(inputObj, this);
    }

    _createClass(Input, [{
      key: "validate",
      value: function validate(value) {
        return validateInput(this, value);
      }
    }, {
      key: "validateIO",
      value: function validateIO(value) {
        return validateIOInput(this, value);
      }
    }], [{
      key: "of",
      value: function of(inputObj) {
        return new Input(inputObj);
      }
    }]);

    return Input;
  }();

  _exports.Input = Input;
});