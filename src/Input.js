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
        const {validators, filters, breakOnFailure,
                valueObscured, valueObscurator} = input,
            vResult = runValidators(validators, breakOnFailure, value),
            fResult = runFilters(filters, value),
            oResult = valueObscured && valueObscurator ? valueObscurator(fResult) : fResult;
        return toInputValidationResult({
            ...vResult,
            rawValue: value,
            value: fResult,
            filteredValue: fResult,
            obscuredValue: oResult
        });
    },

    validateInputIO = (input, value) => {
        const {validators, filters, breakOnFailure,
                valueObscured, valueObscurator} = input,
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
                        result.obscuredValue =
                            valueObscured && valueObscurator ?
                                valueObscurator(filteredValue) : filteredValue;
                        return toInputValidationResult(result);
                    });
            }
            return Promise.resolve(toInputValidationResult(result));
        });
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

    runFilters = (filters, value) => filters && filters.length ?
        apply(compose, filters)(value) : value,

    runIOFilters = (filters, value, errorCallback = defaultErrorCallback) =>
        runFilters(filters ? map(filter => x => x.then(filter), filters) : null,
            Promise.resolve(value).catch(errorCallback)),

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
    },

    toInputValidationResult = rsltObj =>
        toValidationResult({
                value: null,
                rawValue: null,
                obscuredValue: null,
                filteredValue: null,
                ...rsltObj
            })
;
