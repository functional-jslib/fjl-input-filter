(function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(["exports", "fjl", "./Input", "./Utils"], factory);
  } else if (typeof exports !== "undefined") {
    factory(exports, require("fjl"), require("./Input"), require("./Utils"));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod.exports, global.fjl, global.Input, global.Utils);
    global.InputFilter = mod.exports;
  }
})(this, function (_exports, _fjl, _Input, _Utils) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.InputFilter = _exports.toInputFilterResult = _exports.toInputFilter = _exports.validateIOInputWithName = _exports.validateIOInputFilter = _exports.validateInputFilter = void 0;

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

  function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

  function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

  function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

  function _iterableToArrayLimit(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

  function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

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

    var _partition = (0, _fjl.partition)(function (_ref) {
      var _ref2 = _slicedToArray(_ref, 2),
          _ = _ref2[0],
          result = _ref2[1];

      return result.result;
    }, (0, _fjl.map)(function (_ref3) {
      var _ref4 = _slicedToArray(_ref3, 2),
          key = _ref4[0],
          inputObj = _ref4[1];

      return [key, (0, _Input.validateInput)(inputObj, valuesObj[key])];
    }, (0, _fjl.toAssocList)(inputsObj))),
        _partition2 = _slicedToArray(_partition, 2),
        validResults = _partition2[0],
        invalidResults = _partition2[1],
        messages = (0, _fjl.foldl)(function (agg, _ref5) {
      var _ref6 = _slicedToArray(_ref5, 2),
          key = _ref6[0],
          result = _ref6[1];

      agg[key] = result.messages;
      return agg;
    }, {}, invalidResults),
        validInputs = (0, _fjl.fromAssocList)(validResults),
        invalidInputs = (0, _fjl.fromAssocList)(invalidResults),
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
    var errorHandler = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : _Utils.defaultErrorHandler;

    if (!inputsObj || !valuesObj) {
      return Promise.resolve(toInputFilterResult({
        result: false
      }));
    }

    return Promise.all((0, _fjl.map)(function (_ref7) {
      var _ref8 = _slicedToArray(_ref7, 2),
          key = _ref8[0],
          inputObj = _ref8[1];

      return validateIOInputWithName(inputObj, key, valuesObj[key]);
    }, (0, _fjl.toAssocList)(inputsObj))).then(function (assocList) {
      var _partition3 = (0, _fjl.partition)(function (_ref9) {
        var _ref10 = _slicedToArray(_ref9, 2),
            _ = _ref10[0],
            result = _ref10[1];

        return result.result;
      }, assocList),
          _partition4 = _slicedToArray(_partition3, 2),
          validResults = _partition4[0],
          invalidResults = _partition4[1],
          messages = (0, _fjl.foldl)(function (agg, _ref11) {
        var _ref12 = _slicedToArray(_ref11, 2),
            key = _ref12[0],
            result = _ref12[1];

        agg[key] = result.messages;
        return agg;
      }, {}, invalidResults),
          validInputs = (0, _fjl.fromAssocList)(validResults),
          invalidInputs = (0, _fjl.fromAssocList)(invalidResults),
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
    var errorHandler = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : _Utils.defaultErrorHandler;
    return (0, _Input.validateIOInput)(input, value).then(function (result) {
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
    return Object.defineProperties(outObj, (0, _fjl.foldl)(function (agg, _ref13) {
      var _ref14 = _slicedToArray(_ref13, 2),
          key = _ref14[0],
          inputOpsObj = _ref14[1];

      var inputObj = (0, _Input.toInput)((0, _fjl.assign)(inputOpsObj, {
        name: key
      }));
      inputObj.breakOnFailure = breakOnFailure;
      agg[key] = {
        value: inputObj,
        enumerable: true
      };
      return agg;
    }, {}, (0, _fjl.map)(function (key) {
      return [key, inObj[key]];
    }, (0, _fjl.keys)(inObj))));
  },

  /**
   * @function module:fjlInputFilter.toInputFilterResult
   * @param inResult {Object}
   * @param outResult {Object|*}
   * @returns {InputFilterResult}
   */
  toInputFilterResult = function toInputFilterResult(inResult) {
    var outResult = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    var _outResult = (0, _fjl.defineEnumProps)([[Boolean, 'result', false], [Object, 'messages', {}], [Object, 'validInputs', {}], [Object, 'invalidInputs', {}], [Array, 'validResults', []], [Array, 'invalidResults', []]], outResult);

    return inResult ? (0, _fjl.assign)(_outResult, inResult) : _outResult;
  };
  /**
   * @class InputFilter
   */


  _exports.toInputFilterResult = toInputFilterResult;
  _exports.toInputFilter = toInputFilter;
  _exports.validateIOInputWithName = validateIOInputWithName;
  _exports.validateIOInputFilter = validateIOInputFilter;
  _exports.validateInputFilter = validateInputFilter;

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

  _exports.InputFilter = InputFilter;
});