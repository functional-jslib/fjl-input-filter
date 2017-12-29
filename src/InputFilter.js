import {partition, concatMap, foldl, assign} from 'fjl';

import {validateInput, validateIOInput} from './Input';

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

    toInputFilterResult = result => {
        const _result = defineEnumProps$([
            [Boolean, 'result', false],
            [Object,  'messages', {}],
            [Object,  'validInputs', {}],
            [Object,  'invalidInputs', {}]
        ], {});
        return result ? assign(_result, result) : _result;
    }

;
