import {partition, concatMap, foldl, map, assign, keys} from 'fjl';

import {validateInput, validateIOInput, toInputOptions} from './Input';

import {defineEnumProps$} from 'fjl-mutable';

export const

    toArrayMap = obj => keys(obj).map(key => [key, obj[key]]),

    fromArrayMap = arrayMap => foldl((agg, [key, value]) => {
            agg[key] = value;
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
            }, {}),
            validInputs = fromArrayMap(validResults),
            invalidInputs = fromArrayMap(invalidResults),
            result = !invalidResults.length
        ;
        return toInputFilterResult({
            result,
            validInputs,
            validResults,
            invalidInputs,
            invalidResults,
            messages
        });
    },

    toInputFilter = (inObj,  outObj = {}) =>
        Object.defineProperties(outObj,
            foldl((agg, [key, inputOpsObj]) => {
                    agg[key] = {
                        value: toInputOptions(assign(inputOpsObj, {name: key})),
                        enumerable: true
                    };
                    return agg;
                }, {}, map(key =>
                    [key, inObj[key]],
                    keys(inObj)
                )
            )
        ),

    toInputFilterResult = (inResult, outResult = {}) => {
        const _outResult = defineEnumProps$([
            [Boolean, 'result', false],
            [Object,  'messages', {}],
            [Object,  'validInputs', {}],
            [Object,  'invalidInputs', {}]
        ], outResult);
        return inResult ? assign(_outResult, inResult) : _outResult;
    }

;

export class InputFilter {
    constructor (options) {
        toInputFilter(options, this);
    }
    static of (options) {
        return new InputFilter(options);
    }
}

export class InputFilterResult {
    constructor (options) {
        toInputFilterResult(options, this);
    }
    static of (options) {
        return new InputFilterResult(options);
    }
}

export default {
    InputFilter,
    InputFilterResult,
    toInputFilter,
    toInputFilterResult,
    validateInputFilter,
    toArrayMap,
    fromArrayMap
};
