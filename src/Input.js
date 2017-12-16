/**
 * Created by Ely on 7/24/2014.
 * This is a crude implementation
 * @todo review if we really want to have fallback value
 *      functionality for javascript
 */
import {defineEnumProps$} from 'fjl-mutable';
import {assign, apply, compose, concat, isString, isUndefined} from 'fjl';
import {validationResult} from "fjl-validator";

export const

    validateInput = (input, value) => {
        const
            {validators, filters, breakOnFailure} = input,
            vResult = validators && validators.length ?
                runValidators(validators, value, breakOnFailure) : {result: false},
            {result} = vResult;

        vResult.value = value;
        if (result && filters && filters.length) {
            vResult.filteredValue = runFilters(filters, value);
        }
        return validationResult(vResult);
    },

    runValidators = (validators, value, options) => {
        const
            limit = validators.length,
            {breakOnFailure} = options,
            results = [];
        let
            i = 0,
            result = true;

        // Run validators
        for (; i < limit; i++) {
            const
                validator = validators[i],
                vResult = validator === 'object' ?
                    validator.validateInput(value) : validator(value, options),
            {result: interimResult, messages: msgs} = vResult;
            results.push(vResult);
            if (!interimResult) {
                result = false;
                if (breakOnFailure) {
                    break;
                }
            }
        }

        // Return result
        return new ValidationResult({
            result,
            value,

            // if messages pull them out and concat into one array or empty array
            messages: !result ? concat(results.map(({messages}) => messages)) : []
        });
    },

    runFilters = (filters, value) => filters.length ?
        apply(compose, filters)(value) : value

;

export class Input {
    constructor (options) {
        defineEnumProps$([
            [String,    'name', ''],
            [Boolean,   'required', true],
            [Array,     'filters', []],
            [Array,     'validators', []],
            [Boolean,   'breakOnFailure', false],

            // Protect from adding programmatic validators,
            // from within `isValid`, more than once
            [Boolean, 'validationHasRun', false], // @todo evaluate the necessity
                                                // of this functionality
        ], this);
        if (isString(options)) {
            this.name = options;
        }
        else if (options) {
            assign(this, options);
        }
    }

    validate (value) {
        return validateInput(value, this);
    }

    isValid (value) {
        return validateInput(value, this).result;
    }

}

export default Input;
