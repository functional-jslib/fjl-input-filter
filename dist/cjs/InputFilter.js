'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.InputFilter = exports.toInputFilterResult = exports.toInputFilter = exports.validateIOInputWithName = exports.validateIOInputFilter = exports.validateInputFilter = exports.fromArrayMap = exports.toArrayMap = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }(); /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          * @module InputFilter
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          */


var _fjl = require('fjl');

var _Input = require('./Input');

var _fjlMutable = require('fjl-mutable');

var _Utils = require('./Utils');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * @interface InputFilter {Object.<String, (Input|InputOptions)>}
 * @memberOf fjlInputFilter
 * Contains input objects to validate against (key-value pair object).
 */

var toArrayMap = exports.toArrayMap = function toArrayMap(obj) {
    return (0, _fjl.keys)(obj).map(function (key) {
        return [key, obj[key]];
    });
},
    fromArrayMap = exports.fromArrayMap = function fromArrayMap(arrayMap) {
    return (0, _fjl.foldl)(function (agg, _ref) {
        var _ref2 = _slicedToArray(_ref, 2),
            key = _ref2[0],
            value = _ref2[1];

        agg[key] = value;
        return agg;
    }, {}, arrayMap);
},
    validateInputFilter = exports.validateInputFilter = function validateInputFilter(inputsObj, valuesObj) {
    if (!inputsObj || !valuesObj) {
        return toInputFilterResult({ result: false });
    }

    var _partition = (0, _fjl.partition)(function (_ref3) {
        var _ref4 = _slicedToArray(_ref3, 2),
            _ = _ref4[0],
            result = _ref4[1];

        return result.result;
    }, (0, _fjl.map)(function (_ref5) {
        var _ref6 = _slicedToArray(_ref5, 2),
            key = _ref6[0],
            inputObj = _ref6[1];

        return [key, (0, _Input.validateInput)(inputObj, valuesObj[key])];
    }, toArrayMap(inputsObj))),
        _partition2 = _slicedToArray(_partition, 2),
        validResults = _partition2[0],
        invalidResults = _partition2[1],
        messages = (0, _fjl.foldl)(function (agg, _ref7) {
        var _ref8 = _slicedToArray(_ref7, 2),
            key = _ref8[0],
            result = _ref8[1];

        agg[key] = result.messages;
        return agg;
    }, {}, invalidResults),
        validInputs = fromArrayMap(validResults),
        invalidInputs = fromArrayMap(invalidResults),
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
    validateIOInputFilter = exports.validateIOInputFilter = function validateIOInputFilter(inputsObj, valuesObj) {
    var errorHandler = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : _Utils.defaultErrorHandler;

    if (!inputsObj || !valuesObj) {
        return Promise.resolve(toInputFilterResult({ result: false }));
    }

    return Promise.all((0, _fjl.map)(function (_ref9) {
        var _ref10 = _slicedToArray(_ref9, 2),
            key = _ref10[0],
            inputObj = _ref10[1];

        return validateIOInputWithName(inputObj, key, valuesObj[key]);
    }, toArrayMap(inputsObj))).then(function (assocList) {
        var _partition3 = (0, _fjl.partition)(function (_ref11) {
            var _ref12 = _slicedToArray(_ref11, 2),
                _ = _ref12[0],
                result = _ref12[1];

            return result.result;
        }, assocList),
            _partition4 = _slicedToArray(_partition3, 2),
            validResults = _partition4[0],
            invalidResults = _partition4[1],
            messages = (0, _fjl.foldl)(function (agg, _ref13) {
            var _ref14 = _slicedToArray(_ref13, 2),
                key = _ref14[0],
                result = _ref14[1];

            agg[key] = result.messages;
            return agg;
        }, {}, invalidResults),
            validInputs = fromArrayMap(validResults),
            invalidInputs = fromArrayMap(invalidResults),
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
    validateIOInputWithName = exports.validateIOInputWithName = function validateIOInputWithName(input, name, value) {
    var errorHandler = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : _Utils.defaultErrorHandler;
    return (0, _Input.validateIOInput)(input, value).then(function (result) {
        return Promise.resolve([name, result]);
    }, errorHandler);
},
    toInputFilter = exports.toInputFilter = function toInputFilter(inObj) {
    var breakOnFailure = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
    var outObj = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    return Object.defineProperties(outObj, (0, _fjl.foldl)(function (agg, _ref15) {
        var _ref16 = _slicedToArray(_ref15, 2),
            key = _ref16[0],
            inputOpsObj = _ref16[1];

        var inputObj = (0, _Input.toInput)((0, _fjl.assign)(inputOpsObj, { name: key }));
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
    toInputFilterResult = exports.toInputFilterResult = function toInputFilterResult(inResult) {
    var outResult = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    var _outResult = (0, _fjlMutable.defineEnumProps$)([[Boolean, 'result', false], [Object, 'messages', {}], [Object, 'validInputs', {}], [Object, 'invalidInputs', {}], [Array, 'validResults', []], [Array, 'invalidResults', []]], outResult);
    return inResult ? (0, _fjl.assign)(_outResult, inResult) : _outResult;
};

var InputFilter = exports.InputFilter = function () {
    function InputFilter(inputsObj) {
        var breakOnFailure = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

        _classCallCheck(this, InputFilter);

        toInputFilter(inputsObj, breakOnFailure, this);
    }

    _createClass(InputFilter, [{
        key: 'validate',
        value: function validate(data) {
            return validateInputFilter(this, data);
        }
    }, {
        key: 'validateIO',
        value: function validateIO(data) {
            return validateIOInputFilter(this, data);
        }
    }], [{
        key: 'of',
        value: function of(inputsObj, breakOnFailure) {
            return new InputFilter(inputsObj, breakOnFailure);
        }
    }]);

    return InputFilter;
}();

exports.default = {
    InputFilter: InputFilter,
    toInputFilter: toInputFilter,
    toInputFilterResult: toInputFilterResult,
    validateInputFilter: validateInputFilter,
    validateIOInputFilter: validateIOInputFilter,
    validateIOInputWithName: validateIOInputWithName,
    toArrayMap: toArrayMap,
    fromArrayMap: fromArrayMap
};