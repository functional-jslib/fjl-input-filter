var fjlInputFilter = (function (exports,fjlMutable,fjl,fjlValidator) {
'use strict';

var classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

var createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();



























var slicedToArray = function () {
  function sliceIterator(arr, i) {
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
        if (!_n && _i["return"]) _i["return"]();
      } finally {
        if (_d) throw _e;
      }
    }

    return _arr;
  }

  return function (arr, i) {
    if (Array.isArray(arr)) {
      return arr;
    } else if (Symbol.iterator in Object(arr)) {
      return sliceIterator(arr, i);
    } else {
      throw new TypeError("Invalid attempt to destructure non-iterable instance");
    }
  };
}();

/**
 * Created by Ely on 7/24/2014.
 * This is a crude implementation
 * @todo review if we really want to have fallback value
 *      functionality for javascript
 */
var defaultErrorCallback = console.log.bind(console);
var validateInput = function validateInput(input, value) {
    var validators = input.validators,
        filters = input.filters,
        breakOnFailure = input.breakOnFailure,
        valueObscured = input.valueObscured,
        valueObscurator = input.valueObscurator,
        name = input.name,
        vResult = runValidators(validators, breakOnFailure, value),
        fResult = runFilters(filters, value),
        oResult = valueObscured && valueObscurator ? valueObscurator(fResult) : fResult;

    return toInputValidationResult(fjl.assign(vResult, {
        name: name || '',
        rawValue: value,
        value: fResult,
        filteredValue: fResult,
        obscuredValue: oResult
    }));
};
var validateIOInput = function validateIOInput(input, value) {
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
};
var runValidators = function runValidators(validators, breakOnFailure, value) {
    var result = true,
        i = 0,
        messageResults = [];
    if (!validators || !validators.length) {
        return fjlValidator.toValidationResult({ result: result });
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
    return fjlValidator.toValidationResult({ result: result, messages: fjl.concat(messageResults) });
};
var runIOValidators = function runIOValidators(validators, breakOnFailure, value) {
    var errorCallback = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : defaultErrorCallback;

    if (!validators || !validators.length) {
        return Promise.resolve(fjlValidator.toValidationResult({ result: true }));
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
        return fjlValidator.toValidationResult(interimResult);
    }).catch(errorCallback);
};
var runFilters = function runFilters(filters, value) {
    return filters && filters.length ? fjl.apply(fjl.compose, filters)(value) : value;
};
var runIOFilters = function runIOFilters(filters, value) {
    var errorCallback = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : defaultErrorCallback;
    return runFilters(filters ? filters.map(function (filter) {
        return function (x) {
            return x.then(filter);
        };
    }) : null, Promise.resolve(value).catch(errorCallback));
};
var toInput = function toInput(inputObj) {
    var out = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    var _inputObj = fjlMutable.defineEnumProps$([[String, 'name', ''], [Boolean, 'required', false], [Array, 'filters', []], [Array, 'validators', []], [Boolean, 'breakOnFailure', false]], fjlValidator.toValidationOptions(out));
    if (fjl.isString(inputObj)) {
        _inputObj.name = inputObj;
    } else if (inputObj) {
        fjl.assign(_inputObj, inputObj);
    }
    if (_inputObj.required) {
        _inputObj.validators.push(fjlValidator.notEmptyValidator(null));
    }
    return _inputObj;
};
var toInputValidationResult = function toInputValidationResult(resultObj) {
    var _result = fjlMutable.defineEnumProps$([[String, 'name', ''], [Boolean, 'result', false], [Array, 'messages', []]], {
        value: null,
        rawValue: null,
        obscuredValue: null,
        filteredValue: null
    });
    return fjl.assign(_result, resultObj);
};

var Input = function () {
    function Input(inputObj) {
        classCallCheck(this, Input);

        toInput(inputObj, this);
    }

    createClass(Input, [{
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

var defaultErrorHandler = console.error.bind(console);
var toArrayMap = function toArrayMap(obj) {
    return fjl.keys(obj).map(function (key) {
        return [key, obj[key]];
    });
};
var fromArrayMap = function fromArrayMap(arrayMap) {
    return fjl.foldl(function (agg, _ref) {
        var _ref2 = slicedToArray(_ref, 2),
            key = _ref2[0],
            value = _ref2[1];

        agg[key] = value;
        return agg;
    }, {}, arrayMap);
};
var validateInputFilter = function validateInputFilter(inputsObj, valuesObj) {
    if (!inputsObj || !valuesObj) {
        return toInputFilterResult({ result: false });
    }

    var _partition = fjl.partition(function (_ref3) {
        var _ref4 = slicedToArray(_ref3, 2),
            _ = _ref4[0],
            result = _ref4[1];

        return result.result;
    }, fjl.map(function (_ref5) {
        var _ref6 = slicedToArray(_ref5, 2),
            key = _ref6[0],
            inputObj = _ref6[1];

        return [key, validateInput(inputObj, valuesObj[key])];
    }, toArrayMap(inputsObj))),
        _partition2 = slicedToArray(_partition, 2),
        validResults = _partition2[0],
        invalidResults = _partition2[1],
        messages = fjl.foldl(function (agg, _ref7) {
        var _ref8 = slicedToArray(_ref7, 2),
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
};
var validateIOInputFilter = function validateIOInputFilter(inputsObj, valuesObj) {
    var errorHandler = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : defaultErrorHandler;

    if (!inputsObj || !valuesObj) {
        return Promise.resolve(toInputFilterResult({ result: false }));
    }

    return Promise.all(fjl.map(function (_ref9) {
        var _ref10 = slicedToArray(_ref9, 2),
            key = _ref10[0],
            inputObj = _ref10[1];

        return validateIOInputWithName(inputObj, key, valuesObj[key]);
    }, toArrayMap(inputsObj))).then(function (assocList) {
        var _partition3 = fjl.partition(function (_ref11) {
            var _ref12 = slicedToArray(_ref11, 2),
                _ = _ref12[0],
                result = _ref12[1];

            return result.result;
        }, assocList),
            _partition4 = slicedToArray(_partition3, 2),
            validResults = _partition4[0],
            invalidResults = _partition4[1],
            messages = fjl.foldl(function (agg, _ref13) {
            var _ref14 = slicedToArray(_ref13, 2),
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
};
var validateIOInputWithName = function validateIOInputWithName(input, name, value) {
    var errorHandler = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : defaultErrorHandler;
    return validateIOInput(input, value).then(function (result) {
        return Promise.resolve([name, result]);
    }, errorHandler);
};
var toInputFilter = function toInputFilter(inObj) {
    var breakOnFailure = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
    var outObj = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    return Object.defineProperties(outObj, fjl.foldl(function (agg, _ref15) {
        var _ref16 = slicedToArray(_ref15, 2),
            key = _ref16[0],
            inputOpsObj = _ref16[1];

        var inputObj = toInput(fjl.assign(inputOpsObj, { name: key }));
        inputObj.breakOnFailure = breakOnFailure;
        agg[key] = {
            value: inputObj,
            enumerable: true
        };
        return agg;
    }, {}, fjl.map(function (key) {
        return [key, inObj[key]];
    }, fjl.keys(inObj))));
};
var toInputFilterResult = function toInputFilterResult(inResult) {
    var outResult = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    var _outResult = fjlMutable.defineEnumProps$([[Boolean, 'result', false], [Object, 'messages', {}], [Object, 'validInputs', {}], [Object, 'invalidInputs', {}], [Array, 'validResults', []], [Array, 'invalidResults', []]], outResult);
    return inResult ? fjl.assign(_outResult, inResult) : _outResult;
};

var InputFilter = function () {
    function InputFilter(inputsObj) {
        var breakOnFailure = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
        classCallCheck(this, InputFilter);

        toInputFilter(inputsObj, breakOnFailure, this);
    }

    createClass(InputFilter, [{
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

exports.defaultErrorCallback = defaultErrorCallback;
exports.validateInput = validateInput;
exports.validateIOInput = validateIOInput;
exports.runValidators = runValidators;
exports.runIOValidators = runIOValidators;
exports.runFilters = runFilters;
exports.runIOFilters = runIOFilters;
exports.toInput = toInput;
exports.toInputValidationResult = toInputValidationResult;
exports.Input = Input;
exports.defaultErrorHandler = defaultErrorHandler;
exports.toArrayMap = toArrayMap;
exports.fromArrayMap = fromArrayMap;
exports.validateInputFilter = validateInputFilter;
exports.validateIOInputFilter = validateIOInputFilter;
exports.validateIOInputWithName = validateIOInputWithName;
exports.toInputFilter = toInputFilter;
exports.toInputFilterResult = toInputFilterResult;
exports.InputFilter = InputFilter;

return exports;

}({},fjlMutable,fjl,fjlValidator));
//# sourceMappingURL=fjl-input-filter.js.map
