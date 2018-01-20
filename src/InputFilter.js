import {partition, concatMap, foldl, map, assign, keys} from 'fjl';

import {validateInput, validateIOInput, toInput} from './Input';

import {defineEnumProps$} from 'fjl-mutable';

export const

    defaultErrorHandler = console.error.bind(console),

    toArrayMap = obj => keys(obj).map(key => [key, obj[key]]),

    fromArrayMap = arrayMap => foldl((agg, [key, value]) => {
            agg[key] = value;
            return agg;
        }, {}, arrayMap),

    validateInputFilter = (inputsObj, valuesObj) => {
        if (!inputsObj || !valuesObj) {
            return toInputFilterResult({result: false});
        }
        const [validResults, invalidResults] =
            partition(([key, result]) => result.result,
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
            result = !invalidResults.length
        ;
        return toInputFilterResult({
            result,
            validInputs,
            invalidInputs,
            validResults,
            invalidResults,
            messages
        });
    },

    validateIOInputFilter = (inputsObj, valuesObj, errorHandler = defaultErrorHandler) => {
        if (!inputsObj || !valuesObj) {
            return Promise.resolve(toInputFilterResult({result: false}));
        }

        return Promise.all(map(([key, inputObj]) =>
            validateIOInputWithName(inputObj, key, valuesObj[key]),
                toArrayMap(inputsObj)
        )).then(assocList => {
            const [validResults, invalidResults] =
                    partition(([key, result]) => result.result, assocList),
                messages = foldl((agg, [key, result]) => {
                    agg[key] = result.messages;
                    return agg;
                }, {}, invalidResults),
                validInputs = fromArrayMap(validResults),
                invalidInputs = fromArrayMap(invalidResults),
                result = !invalidResults.length
            ;

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
    },

    validateIOInputWithName = (input, name, value, errorHandler = defaultErrorHandler) =>
        validateIOInput(input, value)
            .then(result => Promise.resolve([name, result]), errorHandler),

    toInputFilter = (inObj, breakOnFailure = false, outObj = {}) =>
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
        ),

    toInputFilterResult = (inResult, outResult = {}) => {
        const _outResult = defineEnumProps$([
            [Boolean, 'result', false],
            [Object,  'messages', {}],
            [Object,  'validInputs', {}],
            [Object,  'invalidInputs', {}],
            [Array,   'validResults', []],
            [Array,   'invalidResults', []]
        ], outResult);
        return inResult ? assign(_outResult, inResult) : _outResult;
    }

;

export class InputFilter {
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

export default {
    InputFilter,
    toInputFilter,
    toInputFilterResult,
    validateInputFilter,
    validateIOInputFilter,
    validateIOInputWithName,
    toArrayMap,
    fromArrayMap
};
