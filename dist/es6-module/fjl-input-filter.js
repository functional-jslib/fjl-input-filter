import { defineEnumProps } from 'fjl-mutable';
import { assign, apply, compose, concat, isString, isArray, isset, partition, foldl, map, keys, toAssocList, fromAssocList } from 'fjl';
import { toValidationResult, toValidationOptions, notEmptyValidator } from 'fjl-validator';

/**
 * Same as `console.error`.  Used by *IO variant methods (methods that work with promises) in fjlInputFilter;
 * E.g., used as the error catcher on promises returned from IO processes.
 * @function module:fjlInputFilter.defaultErrorHandler
 * @returns {void}
 */
const defaultErrorHandler = console.error.bind(console);

/**
 * Created by Ely on 7/24/2014.
 */
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

const noValidationRequired = (input, value) => !input.required && (!isset(value) || (isString(value) || isArray(value)) && !value.length),

/**
 * Validates an input object based.
 * @function module:fjlInputFilter.validateInput
 * @param input {Input|InputOptions}
 * @param value {*}
 * @returns {InputValidationResult}
 */
validateInput = (input, value) => {
  const {
    validators,
    filters,
    breakOnFailure,
    valueObscured,
    valueObscurator,
    name
  } = input; // If value is not required and is `null` or `undefined`

  if (noValidationRequired(input, value)) {
    return toInputValidationResult({
      result: true,
      name: name || '',
      rawValue: value,
      value,
      filteredValue: value,
      obscuredValue: value
    });
  } // Run validation and filtering


  let vResult = runValidators(validators, breakOnFailure, value),
      fResult = runFilters(filters, value),
      oResult = valueObscured && valueObscurator ? valueObscurator(fResult) : fResult;
  return toInputValidationResult(assign(vResult, {
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
validateIOInput = (input, value) => {
  const {
    validators,
    filters,
    breakOnFailure,
    valueObscured,
    valueObscurator
  } = input; // If not required and value is `null` or `undefined` return truthy result

  if (noValidationRequired(input, value)) {
    return Promise.resolve(toInputValidationResult({
      result: true,
      name: input.name || '',
      rawValue: value,
      value,
      filteredValue: value,
      obscuredValue: value
    }));
  }

  let pendingValidation = validators && validators.length ? runIOValidators(validators, breakOnFailure, value, input) : Promise.resolve({
    result: true
  });
  return pendingValidation.then(result => runIOFilters(filters, value).then(filteredValue => {
    result.rawValue = value;
    result.value = result.filteredValue = filteredValue;
    result.obscuredValue = valueObscured && valueObscurator ? valueObscurator(filteredValue) : filteredValue;
    return toInputValidationResult(result);
  }));
},

/**
 * Runs validator against given `value`.
 * @function module:fjlInputFilter.runValidators
 * @param validators {Array.<Function>}
 * @param breakOnFailure {Boolean}
 * @param value {*}
 * @returns {*}
 */
runValidators = (validators, breakOnFailure, value) => {
  let result = true,
      i = 0,
      messageResults = [];

  if (!validators || !validators.length) {
    return toValidationResult({
      result
    });
  }

  const limit = validators.length;

  for (; i < limit; i++) {
    const vResult = validators[i](value);

    if (!vResult.result) {
      messageResults.push(vResult.messages);
      result = false;

      if (breakOnFailure) {
        break;
      }
    }
  }

  return toValidationResult({
    result,
    messages: concat(messageResults)
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
runIOValidators = (validators, breakOnFailure, value, errorCallback = defaultErrorHandler) => {
  if (!validators || !validators.length) {
    return Promise.resolve(toValidationResult({
      result: true
    }));
  }

  const limit = validators.length,
        pendingResults = [];
  let i = 0,
      result = true;

  for (; i < limit; i++) {
    const validator = validators[i],
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

  return Promise.all(pendingResults).then(results => {
    const failedResults = results.filter(rslt => !rslt.result),
          interimResult = {
      result,
      messages: failedResults.reduce((agg, item) => agg.concat(item.messages), [])
    };

    if (failedResults.length) {
      interimResult.result = false;
    }

    return toValidationResult(interimResult);
  }).catch(errorCallback);
},

/**
 * Runs filters on value (successively).
 * @function module:fjlInputFilter.runFilters
 * @param filters {Array.<Function>}
 * @param value {*}
 * @returns {*}
 */
runFilters = (filters, value) => filters && filters.length ? apply(compose, filters)(value) : value,

/**
 * Runs filters on value (successively) and returns result wrapped in a promise.
 * @function module:fjlInputFilter.runIOFilters
 * @param filters {Array.<Function>}
 * @param value {*}
 * @param [errorCallback=console.error] {Function}
 * @returns {Promise.<*>}
 */
runIOFilters = (filters, value, errorCallback = defaultErrorHandler) => runFilters(filters ? filters.map(filter => x => x.then(filter)) : null, Promise.resolve(value).catch(errorCallback)),

/**
 * Returns an `InputOptions` object from given object and optionally turns the `out` object into
 * said `InputOptions` with firstParam assigned on top of it.
 * @function module:fjlInputFilter.toInput
 * @param inputObj {Object|*} - Object to build `InputOptions` object from.
 * @param [out = {}] {Object|*}
 * @returns {InputOptions}
 */
toInput = (inputObj, out = {}) => {
  const _inputObj = defineEnumProps([[String, 'name', ''], [Boolean, 'required', false], [Array, 'filters', []], [Array, 'validators', []], [Boolean, 'breakOnFailure', false]], toValidationOptions(out));

  if (isString(inputObj)) {
    _inputObj.name = inputObj;
  } else if (inputObj) {
    assign(_inputObj, inputObj);
  }

  if (_inputObj.required) {
    _inputObj.validators = _inputObj.validators.slice(0);

    _inputObj.validators.push(notEmptyValidator(null));
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
toInputValidationResult = resultObj => {
  const _result = defineEnumProps([[String, 'name', ''], [Boolean, 'result', false], [Array, 'messages', []]], {
    value: null,
    rawValue: null,
    obscuredValue: null,
    filteredValue: null
  });

  return assign(_result, resultObj);
};
/**
 * @memberOf fjlInputFilter
 * @class Input
 * @extends InputOptions
 */

class Input {
  constructor(inputObj) {
    toInput(inputObj, this);
  }

  static of(inputObj) {
    return new Input(inputObj);
  }

  validate(value) {
    return validateInput(this, value);
  }

  validateIO(value) {
    return validateIOInput(this, value);
  }

}

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

const 
/**
 * @function module:fjlInputFilter.validateInputFilter
 * @param inputsObj {InputFilter}
 * @param valuesObj {Object.<String,*>}
 * @returns {InputFilterResult}
 */
validateInputFilter = (inputsObj, valuesObj) => {
  if (!inputsObj || !valuesObj) {
    return toInputFilterResult({
      result: false
    });
  }

  const [validResults, invalidResults] = partition(([_, result]) => result.result, map(([key, inputObj]) => [key, validateInput(inputObj, valuesObj[key])], toAssocList(inputsObj))),
        messages = foldl((agg, [key, result]) => {
    agg[key] = result.messages;
    return agg;
  }, {}, invalidResults),
        validInputs = fromAssocList(validResults),
        invalidInputs = fromAssocList(invalidResults),
        result = !invalidResults.length;
  return toInputFilterResult({
    result,
    validInputs,
    invalidInputs,
    validResults,
    invalidResults,
    messages
  });
},

/**
 * @function module:fjlInputFilter.validateIOInputFilter
 * @param inputsObj {InputFilter}
 * @param valuesObj {Object.<String, *>}
 * @param errorHandler {Function}
 * @returns {Promise.<InputFilterResult>}
 */
validateIOInputFilter = (inputsObj, valuesObj, errorHandler = defaultErrorHandler) => {
  if (!inputsObj || !valuesObj) {
    return Promise.resolve(toInputFilterResult({
      result: false
    }));
  }

  return Promise.all(map(([key, inputObj]) => validateIOInputWithName(inputObj, key, valuesObj[key]), toAssocList(inputsObj))).then(assocList => {
    const [validResults, invalidResults] = partition(([_, result]) => result.result, assocList),
          messages = foldl((agg, [key, result]) => {
      agg[key] = result.messages;
      return agg;
    }, {}, invalidResults),
          validInputs = fromAssocList(validResults),
          invalidInputs = fromAssocList(invalidResults),
          result = !invalidResults.length;
    return toInputFilterResult({
      result,
      validInputs,
      invalidInputs,
      validResults,
      invalidResults,
      messages
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
validateIOInputWithName = (input, name, value, errorHandler = defaultErrorHandler) => validateIOInput(input, value).then(result => Promise.resolve([name, result]), errorHandler),

/**
 * @function module:fjlInputFilter.toInputFilter
 * @param inObj {Object.<String, Object>}
 * @param breakOnFailure {Boolean}
 * @param outObj {Object|*}
 * @returns {InputFilter}
 */
toInputFilter = (inObj, breakOnFailure = false, outObj = {}) => Object.defineProperties(outObj, foldl((agg, [key, inputOpsObj]) => {
  const inputObj = toInput(assign(inputOpsObj, {
    name: key
  }));
  inputObj.breakOnFailure = breakOnFailure;
  agg[key] = {
    value: inputObj,
    enumerable: true
  };
  return agg;
}, {}, map(key => [key, inObj[key]], keys(inObj)))),

/**
 * @function module:fjlInputFilter.toInputFilterResult
 * @param inResult {Object}
 * @param outResult {Object|*}
 * @returns {InputFilterResult}
 */
toInputFilterResult = (inResult, outResult = {}) => {
  const _outResult = defineEnumProps([[Boolean, 'result', false], [Object, 'messages', {}], [Object, 'validInputs', {}], [Object, 'invalidInputs', {}], [Array, 'validResults', []], [Array, 'invalidResults', []]], outResult);

  return inResult ? assign(_outResult, inResult) : _outResult;
};
/**
 * @class InputFilter
 */

class InputFilter {
  constructor(inputsObj, breakOnFailure = false) {
    toInputFilter(inputsObj, breakOnFailure, this);
  }

  static of(inputsObj, breakOnFailure) {
    return new InputFilter(inputsObj, breakOnFailure);
  }

  validate(data) {
    return validateInputFilter(this, data);
  }

  validateIO(data) {
    return validateIOInputFilter(this, data);
  }

}

/**
 * @module fjlInputFilter
 */

export { noValidationRequired, validateInput, validateIOInput, runValidators, runIOValidators, runFilters, runIOFilters, toInput, toInputValidationResult, Input, validateInputFilter, validateIOInputFilter, validateIOInputWithName, toInputFilter, toInputFilterResult, InputFilter };
//# sourceMappingURL=fjl-input-filter.js.map
