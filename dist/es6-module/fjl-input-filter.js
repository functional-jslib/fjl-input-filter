import { defineEnumProps$ } from 'fjl-mutable';
import { apply, assign, compose, concat, foldl, isString, keys, map, partition } from 'fjl';
import { notEmptyValidator, toValidationOptions, toValidationResult } from 'fjl-validator';

/**
 * @module Utils
 */

const defaultErrorHandler = console.error.bind(console);

/**
 * Created by Ely on 7/24/2014.
 * @module Input
 */
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

const validateInput = (input, value) => {
        const {validators, filters, breakOnFailure,
                valueObscured, valueObscurator, name} = input,
            vResult = runValidators(validators, breakOnFailure, value),
            fResult = runFilters(filters, value),
            oResult = valueObscured && valueObscurator ? valueObscurator(fResult) : fResult;
        return toInputValidationResult(assign(vResult, {
            name: name || '',
            rawValue: value,
            value: fResult,
            filteredValue: fResult,
            obscuredValue: oResult
        }));
    };
const validateIOInput = (input, value) => {
        const {validators, filters, breakOnFailure,
                valueObscured, valueObscurator} = input,
            pendingValidation = validators && validators.length ?
                runIOValidators(validators, breakOnFailure, value, input) :
                    Promise.resolve({result: true});
        return pendingValidation.then(result =>
            runIOFilters(filters, value)
                .then(filteredValue => {
                    result.rawValue = value;
                    result.value = result.filteredValue = filteredValue;
                    result.obscuredValue =
                        valueObscured && valueObscurator ?
                            valueObscurator(filteredValue) : filteredValue;
                    return toInputValidationResult(result);
                })
        );
    };
const runValidators = (validators, breakOnFailure, value) => {
        let result = true,
            i = 0,
            messageResults = [];
        if (!validators || !validators.length) {
            return toValidationResult({result});
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
        return toValidationResult({result, messages: concat(messageResults)});
    };
const runIOValidators = (validators, breakOnFailure, value, errorCallback = defaultErrorHandler) => {
        if (!validators || !validators.length) {
            return Promise.resolve(toValidationResult({result: true}));
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

        return Promise.all(pendingResults)
            .then(results => {
                const failedResults = results.filter(rslt => !rslt.result),
                    interimResult = {
                        result,
                        messages: failedResults.reduce((agg, item) => {
                            agg = agg.concat(item.messages);
                            return agg;
                        }, [])
                    };
                if (failedResults.length) {
                    interimResult.result = false;
                }
                return toValidationResult(interimResult);
            })
            .catch(errorCallback);
    };
const runFilters = (filters, value) => filters && filters.length ?
        apply(compose, filters)(value) : value;
const runIOFilters = (filters, value, errorCallback = defaultErrorHandler) =>
        runFilters(filters ? filters.map(filter => x => x.then(filter)) : null,
            Promise.resolve(value).catch(errorCallback));
const toInput = (inputObj, out = {}) => {
        const _inputObj = defineEnumProps$([
            [String,    'name', ''],
            [Boolean,   'required', false],
            [Array,     'filters', []],
            [Array,     'validators', []],
            [Boolean,   'breakOnFailure', false]
        ], toValidationOptions(out));
        if (isString(inputObj)) {
            _inputObj.name = inputObj;
        }
        else if (inputObj) {
            assign(_inputObj, inputObj);
        }
        if (_inputObj.required) {
            _inputObj.validators.push(notEmptyValidator(null));
        }
        return _inputObj;
    };
const toInputValidationResult = resultObj => {
        const _result = defineEnumProps$([
            [String, 'name', ''],
            [Boolean, 'result', false],
            [Array, 'messages', []]
        ], {
            value: null,
            rawValue: null,
            obscuredValue: null,
            filteredValue: null
        });
        return assign(_result, resultObj);
    };

/**
 * @memberOf module:fjlInputFilter
 * @class Input
 * @extends InputOptions
 */
class Input {
    constructor (inputObj) {
        toInput(inputObj, this);
    }
    static of (inputObj) {
        return new Input(inputObj);
    }
    validate (value) {
        return validateInput(this, value);
    }
    validateIO (value) {
        return validateIOInput(this, value);
    }
}

/**
 * @module InputFilter
 */
/**
 * @interface InputFilter {Object.<String, (Input|InputOptions)>}
 * @memberOf fjlInputFilter
 * Contains input objects to validate against (key-value pair object).
 */

const toArrayMap = obj => keys(obj).map(key => [key, obj[key]]);
const fromArrayMap = arrayMap => foldl((agg, [key, value]) => {
            agg[key] = value;
            return agg;
        }, {}, arrayMap);
const validateInputFilter = (inputsObj, valuesObj) => {
        if (!inputsObj || !valuesObj) {
            return toInputFilterResult({result: false});
        }
        const [validResults, invalidResults] =
            partition(([_, result]) => result.result,
                map(([key, inputObj]) =>
                    [key, validateInput(inputObj, valuesObj[key])],
                    toArrayMap(inputsObj)
                )),
            messages = foldl((agg, [key, result]) => {
                agg[key] = result.messages;
                return agg;
            }, {}, invalidResults),
            validInputs = fromArrayMap(validResults),
            invalidInputs = fromArrayMap(invalidResults),
            result = !invalidResults.length;
        return toInputFilterResult({
            result,
            validInputs,
            invalidInputs,
            validResults,
            invalidResults,
            messages
        });
    };
const validateIOInputFilter = (inputsObj, valuesObj, errorHandler = defaultErrorHandler) => {
        if (!inputsObj || !valuesObj) {
            return Promise.resolve(toInputFilterResult({result: false}));
        }

        return Promise.all(map(([key, inputObj]) =>
            validateIOInputWithName(inputObj, key, valuesObj[key]),
                toArrayMap(inputsObj)
        )).then(assocList => {
            const [validResults, invalidResults] =
                    partition(([_, result]) => result.result, assocList),
                messages = foldl((agg, [key, result]) => {
                    agg[key] = result.messages;
                    return agg;
                }, {}, invalidResults),
                validInputs = fromArrayMap(validResults),
                invalidInputs = fromArrayMap(invalidResults),
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
            errorHandler);
    };
const validateIOInputWithName = (input, name, value, errorHandler = defaultErrorHandler) =>
        validateIOInput(input, value)
            .then(result => Promise.resolve([name, result]), errorHandler);
const toInputFilter = (inObj, breakOnFailure = false, outObj = {}) =>
        Object.defineProperties(outObj,
            foldl((agg, [key, inputOpsObj]) => {
                const inputObj = toInput(assign(inputOpsObj, {name: key}));
                inputObj.breakOnFailure = breakOnFailure;
                agg[key] = {
                    value: inputObj,
                    enumerable: true
                };
                return agg;
            }, {}, map(key =>
                [key, inObj[key]],
                keys(inObj)
            ))
        );
const toInputFilterResult = (inResult, outResult = {}) => {
        const _outResult = defineEnumProps$([
            [Boolean, 'result', false],
            [Object,  'messages', {}],
            [Object,  'validInputs', {}],
            [Object,  'invalidInputs', {}],
            [Array,   'validResults', []],
            [Array,   'invalidResults', []]
        ], outResult);
        return inResult ? assign(_outResult, inResult) : _outResult;
    };

class InputFilter {
    constructor (inputsObj, breakOnFailure = false) {
        toInputFilter(inputsObj, breakOnFailure, this);
    }
    static of (inputsObj, breakOnFailure) {
        return new InputFilter(inputsObj, breakOnFailure);
    }
    validate (data) {
        return validateInputFilter(this, data);
    }
    validateIO (data) {
        return validateIOInputFilter(this, data);
    }
}

/**
 * @module fjlInputFilter
 */

export { validateInput, validateIOInput, runValidators, runIOValidators, runFilters, runIOFilters, toInput, toInputValidationResult, Input, toArrayMap, fromArrayMap, validateInputFilter, validateIOInputFilter, validateIOInputWithName, toInputFilter, toInputFilterResult, InputFilter };
//# sourceMappingURL=fjl-input-filter.js.map
