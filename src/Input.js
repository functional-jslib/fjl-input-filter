/**
 * Created by Ely on 7/24/2014.
 * This is a crude implementation
 * @todo review if we really want to have fallback value
 *      functionality for javascript
 */
import {defineEnumProps$} from 'fjl-mutable';
import {assign, apply, compose, concat, isString, isUndefined, map} from 'fjl';
import {toValidationResult, toValidationOptions, notEmptyValidator} from "fjl-validator";

export const

    defaultErrorCallback = console.log.bind(console),

    validateInput = (input, value) => {
        const {validators, filters, breakOnFailure,
                valueObscured, valueObscurator, name} = input,
            vResult = runValidators(validators, breakOnFailure, value),
            fResult = runFilters(filters, value),
            oResult = valueObscured && valueObscurator ? valueObscurator(fResult) : fResult;
        return toInputValidationResult({
            name: name || '',
            ...vResult,
            rawValue: value,
            value: fResult,
            filteredValue: fResult,
            obscuredValue: oResult
        });
    },

    validateIOInput = (input, value) => {
        const {validators, filters, breakOnFailure,
                valueObscured, valueObscurator} = input,
            pendingValidation = validators && validators.length ?
                runIOValidators(validators, breakOnFailure, value, input) :
                    Promise.resolve({result: true})
        ;
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
    },

    runValidators = (validators, breakOnFailure, value) => {
        let result = true;
        if (!validators || !validators.length) {
            return toValidationResult({result});
        }
        let i = 0,
            messageResults = [],
            limit = validators.length;
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
    },

    runIOValidators = (validators, breakOnFailure, value, errorCallback = defaultErrorCallback) => {
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
    },

    runFilters = (filters, value) => filters && filters.length ?
        apply(compose, filters)(value) : value,

    runIOFilters = (filters, value, errorCallback = defaultErrorCallback) =>
        runFilters(filters ? map(filter => x => x.then(filter), filters) : null,
            Promise.resolve(value).catch(errorCallback)),

    toInput = (inputObj, out = {}) => {
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
    },

    toInputValidationResult = resultObj => {
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
        return assign(_result, {
            ...resultObj
        });
    }
;

export class Input {
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
