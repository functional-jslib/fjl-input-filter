/**
 * Created by Ely on 7/24/2014.
 * This is a crude implementation
 * @todo review if we really want to have fallback value
 *      functionality for javascript
 */
import {defineEnumProps$} from 'fjl-mutable';
import {assign, apply, compose, concat, isString, isUndefined, map} from 'fjl';
import {toValidationResult, toValidationOptions} from "fjl-validator";

export const

    defaultErrorCallback = console.log.bind(console),

    validateInput = (input, value) => {
        const vResult = runValidatorsOnInput(input, value),
            fResult = runFilters(input.filters || null, value),
            oResult = runObscurator(input, fResult);
        return toValidationResult({
            ...vResult,
            rawValue: value,
            value: fResult,
            filteredValue: fResult,
            obscuredValue: oResult
        });
    },

    validateInputIO = (input, value) => {
        const {validators, filters} = input,
            pendingValidation = validators && validators.length ?
                runIOValidators(validators, value, input) :
                    Promise.resolve({result: true})
        ;
        return pendingValidation.then(result => {
            if (result.result && filters && filters.length) {
                return runIOFilters(filters, value)
                    .then(filteredValue => {
                        result.rawValue = value;
                        result.value = result.filteredValue = filteredValue;
                        result.obscuredValue = runObscurator(input, filteredValue);
                        return toValidationResult(result);
                    });
            }
            return Promise.resolve(toValidationResult(result));
        });
    },

    runValidators = (validators, breakOnFailure, value) => {
        let result = true;
        if (!validators || !validators.length) {
            return {result, value};
        }
        let i = 0,
            messages = [],
            limit = validators.length;
        for (; i < limit; i++) {
            const validator = validators[i],
                vResult = validator(value);
            if (!vResult.result) {
                messages = messages.concat(vResult.messages);
                result = false;
                if (breakOnFailure) {
                    break;
                }
            }
        }
        return toValidationResult({result, messages, value});
    },

    runValidatorsOnInput = (input, value) => {
        const {validators, breakOnFailure} = input;
        return runValidators(validators, breakOnFailure, value);
    },

    runIOValidators = (inputOptions, value, errorCallback = defaultErrorCallback) => {
        const {validators, breakOnFailure} = inputOptions,
            limit = validators.length,
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
                    interimResult = failedResults.reduce((agg, item) => {
                        agg.messages = agg.messages.concat(item.messages);
                        return agg;
                    }, {result, messages: []});
                if (failedResults.length) {
                    interimResult.result = false;
                }
                return toValidationResult(interimResult);
            })
            .catch(errorCallback);
    },

    runIOValidatorsOnInput = (input, value, errorCallback = defaultErrorCallback) => {

    },

    runFilters = (filters, value) => filters && filters.length ?
        apply(compose, filters)(value) : value,

    runFiltersOnInput = (input, value) => runFilters(
        input ? input.filters : null, value),

    runIOFilters = (filters, value, errorCallback = defaultErrorCallback) =>
        runFilters(filters ? map(filter => x => x.then(filter), filters) : null,
            Promise.resolve(value).catch(errorCallback)),

    runIOFiltersOnInput = (input, value, errorCallback = defaultErrorCallback) =>
        runIOFilters(input ? input.filters : null, value, errorCallback),

    runObscurator = (inputOptions, value) => {
        const {valueObscured, valueObscurator} = inputOptions;
        return (valueObscured && valueObscurator) ? valueObscurator(value) : value;
    },

    toInputOptions = options => {
        const inputOptions = defineEnumProps$([
            [String,    'name', ''],
            [Boolean,   'required', true],
            [Array,     'filters', []],
            [Array,     'validators', []],
            [Boolean,   'breakOnFailure', false]
        ], toValidationOptions());
        if (isString(options)) {
            inputOptions.name = options;
        }
        else if (options) {
            assign(inputOptions, options);
        }
        return inputOptions;
    }
;
