var fjlInputFilter = (function (exports, fjl, fjlValidator) {
  'use strict';

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  function _defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  function _createClass(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties(Constructor.prototype, protoProps);
    if (staticProps) _defineProperties(Constructor, staticProps);
    return Constructor;
  }

  function _slicedToArray(arr, i) {
    return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest();
  }

  function _arrayWithHoles(arr) {
    if (Array.isArray(arr)) return arr;
  }

  function _iterableToArrayLimit(arr, i) {
    var _arr = [];
    var _n = true;
    var _d = false;
    var _e = undefined;

    try {
      for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
        _arr.push(_s.value);

        if (i && _arr.length === i) break;
      }
    } catch (err) {
      _d = true;
      _e = err;
    } finally {
      try {
        if (!_n && _i["return"] != null) _i["return"]();
      } finally {
        if (_d) throw _e;
      }
    }

    return _arr;
  }

  function _nonIterableRest() {
    throw new TypeError("Invalid attempt to destructure non-iterable instance");
  }

  /**
   * Same as `console.error`.  Used by *IO variant methods (methods that work with promises) in fjlInputFilter;
   * E.g., used as the error catcher on promises returned from IO processes.
   * @function module:fjlInputFilter.defaultErrorHandler
   * @returns {void}
   */
  var defaultErrorHandler = console.error.bind(console);

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
    return !input.required && (!fjl.isset(value) || (fjl.isString(value) || fjl.isArray(value)) && !value.length);
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
    return toInputValidationResult(fjl.assign(vResult, {
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
      return fjlValidator.toValidationResult({
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

    return fjlValidator.toValidationResult({
      result: result,
      messages: fjl.concat(messageResults)
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
    var errorCallback = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : defaultErrorHandler;

    if (!validators || !validators.length) {
      return Promise.resolve(fjlValidator.toValidationResult({
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

      return fjlValidator.toValidationResult(interimResult);
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
    return filters && filters.length ? fjl.apply(fjl.compose, filters)(value) : value;
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
    var errorCallback = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : defaultErrorHandler;
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

    var _inputObj = fjl.defineEnumProps([[String, 'name', ''], [Boolean, 'required', false], [Array, 'filters', []], [Array, 'validators', []], [Boolean, 'breakOnFailure', false]], fjlValidator.toValidationOptions(out));

    if (fjl.isString(inputObj)) {
      _inputObj.name = inputObj;
    } else if (inputObj) {
      fjl.assign(_inputObj, inputObj);
    }

    if (_inputObj.required) {
      _inputObj.validators = _inputObj.validators.slice(0);

      _inputObj.validators.push(fjlValidator.notEmptyValidator(null));
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
    var _result = fjl.defineEnumProps([[String, 'name', ''], [Boolean, 'result', false], [Array, 'messages', []]], {
      value: null,
      rawValue: null,
      obscuredValue: null,
      filteredValue: null
    });

    return fjl.assign(_result, resultObj);
  };
  /**
   * @memberOf fjlInputFilter
   * @class Input
   * @extends InputOptions
   */

  var Input =
  /*#__PURE__*/
  function () {
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

  /**
   * @interface InputFilter {Object.<String, (Input|InputOptions)>}
   * @desc Contains input objects to validate against (key-value pair object).
   */

  /**
   * @interface InputFilterResult
   * @memberOf fjlInputFilter
   * @property {Boolean} result - Result of validation.
   * @property {Object.<String,InputValidationResult>} validInputs - Valid input results object.
   * @property {Object.<String,InputValidationResult>} invalidInputs - Invalid input results object.
   * @property {Array.<String,InputValidationResult>} validResults - Valid input results associative array.
   * @property {Array.<String,InputValidationResult>} invalidResults - Invalid input results associative array.
   * @property {Object.<String,Array.<String>>} messages - Error messages (if any) mapped to input names.
   */

  var 
  /**
   * @function module:fjlInputFilter.validateInputFilter
   * @param inputsObj {InputFilter}
   * @param valuesObj {Object.<String,*>}
   * @returns {InputFilterResult}
   */
  validateInputFilter = function validateInputFilter(inputsObj, valuesObj) {
    if (!inputsObj || !valuesObj) {
      return toInputFilterResult({
        result: false
      });
    }

    var _partition = fjl.partition(function (_ref) {
      var _ref2 = _slicedToArray(_ref, 2),
          _ = _ref2[0],
          result = _ref2[1];

      return result.result;
    }, fjl.map(function (_ref3) {
      var _ref4 = _slicedToArray(_ref3, 2),
          key = _ref4[0],
          inputObj = _ref4[1];

      return [key, validateInput(inputObj, valuesObj[key])];
    }, fjl.toAssocList(inputsObj))),
        _partition2 = _slicedToArray(_partition, 2),
        validResults = _partition2[0],
        invalidResults = _partition2[1],
        messages = fjl.foldl(function (agg, _ref5) {
      var _ref6 = _slicedToArray(_ref5, 2),
          key = _ref6[0],
          result = _ref6[1];

      agg[key] = result.messages;
      return agg;
    }, {}, invalidResults),
        validInputs = fjl.fromAssocList(validResults),
        invalidInputs = fjl.fromAssocList(invalidResults),
        result = !invalidResults.length;

    return toInputFilterResult({
      result: result,
      validInputs: validInputs,
      invalidInputs: invalidInputs,
      validResults: validResults,
      invalidResults: invalidResults,
      messages: messages
    });
  },

  /**
   * @function module:fjlInputFilter.validateIOInputFilter
   * @param inputsObj {InputFilter}
   * @param valuesObj {Object.<String, *>}
   * @param errorHandler {Function}
   * @returns {Promise.<InputFilterResult>}
   */
  validateIOInputFilter = function validateIOInputFilter(inputsObj, valuesObj) {
    var errorHandler = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : defaultErrorHandler;

    if (!inputsObj || !valuesObj) {
      return Promise.resolve(toInputFilterResult({
        result: false
      }));
    }

    return Promise.all(fjl.map(function (_ref7) {
      var _ref8 = _slicedToArray(_ref7, 2),
          key = _ref8[0],
          inputObj = _ref8[1];

      return validateIOInputWithName(inputObj, key, valuesObj[key]);
    }, fjl.toAssocList(inputsObj))).then(function (assocList) {
      var _partition3 = fjl.partition(function (_ref9) {
        var _ref10 = _slicedToArray(_ref9, 2),
            _ = _ref10[0],
            result = _ref10[1];

        return result.result;
      }, assocList),
          _partition4 = _slicedToArray(_partition3, 2),
          validResults = _partition4[0],
          invalidResults = _partition4[1],
          messages = fjl.foldl(function (agg, _ref11) {
        var _ref12 = _slicedToArray(_ref11, 2),
            key = _ref12[0],
            result = _ref12[1];

        agg[key] = result.messages;
        return agg;
      }, {}, invalidResults),
          validInputs = fjl.fromAssocList(validResults),
          invalidInputs = fjl.fromAssocList(invalidResults),
          result = !invalidResults.length;

      return toInputFilterResult({
        result: result,
        validInputs: validInputs,
        invalidInputs: invalidInputs,
        validResults: validResults,
        invalidResults: invalidResults,
        messages: messages
      });
    }, errorHandler);
  },

  /**
   * @function module:fjlInputFilter.validateIOInputWithName
   * @param input {Input|InputOptions}
   * @param name {String}
   * @param value {*}
   * @param errorHandler {Function}
   * @returns {Promise.<Array.<String,InputValidationResult>>}
   */
  validateIOInputWithName = function validateIOInputWithName(input, name, value) {
    var errorHandler = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : defaultErrorHandler;
    return validateIOInput(input, value).then(function (result) {
      return Promise.resolve([name, result]);
    }, errorHandler);
  },

  /**
   * @function module:fjlInputFilter.toInputFilter
   * @param inObj {Object.<String, Object>}
   * @param breakOnFailure {Boolean}
   * @param outObj {Object|*}
   * @returns {InputFilter}
   */
  toInputFilter = function toInputFilter(inObj) {
    var breakOnFailure = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
    var outObj = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    return Object.defineProperties(outObj, fjl.foldl(function (agg, _ref13) {
      var _ref14 = _slicedToArray(_ref13, 2),
          key = _ref14[0],
          inputOpsObj = _ref14[1];

      var inputObj = toInput(fjl.assign(inputOpsObj, {
        name: key
      }));
      inputObj.breakOnFailure = breakOnFailure;
      agg[key] = {
        value: inputObj,
        enumerable: true
      };
      return agg;
    }, {}, fjl.map(function (key) {
      return [key, inObj[key]];
    }, fjl.keys(inObj))));
  },

  /**
   * @function module:fjlInputFilter.toInputFilterResult
   * @param inResult {Object}
   * @param outResult {Object|*}
   * @returns {InputFilterResult}
   */
  toInputFilterResult = function toInputFilterResult(inResult) {
    var outResult = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    var _outResult = fjl.defineEnumProps([[Boolean, 'result', false], [Object, 'messages', {}], [Object, 'validInputs', {}], [Object, 'invalidInputs', {}], [Array, 'validResults', []], [Array, 'invalidResults', []]], outResult);

    return inResult ? fjl.assign(_outResult, inResult) : _outResult;
  };
  /**
   * @class InputFilter
   */

  var InputFilter =
  /*#__PURE__*/
  function () {
    function InputFilter(inputsObj) {
      var breakOnFailure = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

      _classCallCheck(this, InputFilter);

      toInputFilter(inputsObj, breakOnFailure, this);
    }

    _createClass(InputFilter, [{
      key: "validate",
      value: function validate(data) {
        return validateInputFilter(this, data);
      }
    }, {
      key: "validateIO",
      value: function validateIO(data) {
        return validateIOInputFilter(this, data);
      }
    }], [{
      key: "of",
      value: function of(inputsObj, breakOnFailure) {
        return new InputFilter(inputsObj, breakOnFailure);
      }
    }]);

    return InputFilter;
  }();

  /**
   * @module fjlInputFilter
   */

  exports.Input = Input;
  exports.InputFilter = InputFilter;
  exports.noValidationRequired = noValidationRequired;
  exports.runFilters = runFilters;
  exports.runIOFilters = runIOFilters;
  exports.runIOValidators = runIOValidators;
  exports.runValidators = runValidators;
  exports.toInput = toInput;
  exports.toInputFilter = toInputFilter;
  exports.toInputFilterResult = toInputFilterResult;
  exports.toInputValidationResult = toInputValidationResult;
  exports.validateIOInput = validateIOInput;
  exports.validateIOInputFilter = validateIOInputFilter;
  exports.validateIOInputWithName = validateIOInputWithName;
  exports.validateInput = validateInput;
  exports.validateInputFilter = validateInputFilter;

  return exports;

}({}, fjl, fjlValidator));
//# sourceMappingURL=fjl-input-filter.js.map
