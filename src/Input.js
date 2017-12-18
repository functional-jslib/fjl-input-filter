/**
 * Created by Ely on 7/24/2014.
 * This is a crude implementation
 * @todo review if we really want to have fallback value
 *      functionality for javascript
 */
import {defineEnumProps$} from 'fjl-mutable';
import {assign, apply, compose, concat, isString, isUndefined} from 'fjl';
import {toValidationResult} from "fjl-validator";

export const

    validateInput = (input, value) => {
        const {validators, filters} = input,
            result = validators && validators.length ?
                runValidators(validators, value, input) : {result: true};
        return toValidationResult(result);
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
                        result.filteredValue = filteredValue;
                        return toValidationResult(result);
                    });
            }
            return Promise.resolve(toValidationResult(result));
        });
    },

    runValidators = (inputOptions, value) => {
        const {validators, breakOnFailure} = toInputOptions(inputOptions),
            limit = validators.length;
        let i = 0,
            result = true,
            messages = [];
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

    runIOValidators = (input, validators, value) => {
        const limit = validators.length,
            {breakOnFailure} = options,
            pendingResults = [];
        let i = 0,
            result = true;
        for (; i < limit; i++) {
            const validator = validators[i],
                vResult = validator(options, value);
            pendingResults.push(vResult);
            if (vResult instanceof Promise) {
                continue;
            }
            if (!vResult.result) {
                result = false;
                if (breakOnFailure) {
                    break;
                }
            }
        }

        return Promise.all(pendingResults)
            .then(results => {
                const interimResult = results.filter(rslt => !rslt.result)
                    .reduce((agg, item) => {
                        agg.result = item.result;
                        agg.messages = agg.messages.concat(item.messages);
                        return agg;
                    }, {result, messages: []});
                if (interimResult.messages.length) {
                    interimResult.result = false;
                }
                return interimResult;
            })
            .then(vResult2 => toValidationResult(vResult2));
    },

    runFilters = (filters, value) => filters.length ?
        apply(compose, filters)(value) : value,

    runIOFilters = (filters, value, errorCallback = console.log.bind(console)) =>
        runFilters(map(filter => x => x.then(filter), filters), Promise.resolve(value).catch(errorCallback)),

    toInputOptions = options => {
        const inputOptions = defineEnumProps$([
            [String,    'name', ''],
            [Boolean,   'required', true],
            [Array,     'filters', []],
            [Array,     'validators', []],
            [Boolean,   'breakOnFailure', false]
        ], {});
        if (isString(options)) {
            inputOptions.name = options;
        }
        else if (options) {
            assign(inputOptions, options);
        }
        return inputOptions;
    }
;
