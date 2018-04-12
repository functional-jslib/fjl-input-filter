import {typeOf, keys, map, isType, flip, subsequences, repeat, curry,
    all, isEmpty, isObject, isArray, isBoolean, unfoldr, toArrayMap, fromArrayMap} from 'fjl';
import {expect, assert} from 'chai';
import {notEmptyValidator, regexValidator, stringLengthValidator,
    toValidationResult, toValidationOptions} from 'fjl-validator';
import {runHasPropTypes} from "./utils";
import {
    toInputFilterResult,
    toInputFilter,
    validateInputFilter,
    validateIOInputFilter
} from "../src/InputFilter";

import {inputFilter1, truthyCasesForInputFilter1, falsyCasesForInputFilter1} from './fixtures/input-filter-1';

describe ('InputFilter', function () {

    describe ('#toInputFilterResult', function () {
        // Ensure properties on inputFilter default
       [toInputFilterResult({result: true}), toInputFilterResult()]
           .forEach(inputObj => runHasPropTypes([
               [Boolean, 'result', [false, 99]],
               [Object, 'messages', [{}, 99]],
               [Object, 'validInputs', [{}, 99]],
               [Object, 'invalidInputs', [{}, 99]]
           ], inputObj));
    });

    describe ('#toInputFilter', function () {
        const case1Options = {
                name: {required: true},
                zipcode: {required: true},
                phonenumber: {required: true},
                alnum: {}
            },
            case1 = toInputFilter(case1Options),
            case1Keys = keys(case1);
        test ('should return an object with all keys from passed in options', function () {
            expect(case1Keys.every((key, ind) => case1Options.hasOwnProperty(key)))
                .to.equal(true);
        });
        test ('should return an object with properties which are un-writable', function () {
            case1Keys.map(key => assert.throws(() => case1[key] = 99, Error));
        });
        test ('should return an object with enumerable properties', function () {
            expect(case1Keys.every(key =>
                Object.getOwnPropertyDescriptor(case1, key).enumerable)).to.equal(true);
        });
        test ('should return an object that contains input-options objects for all objects set on passed in options object', function () {
            const propNames = ['name', 'required', 'filters', 'validators', 'breakOnFailure'];
            expect(
                case1Keys.every(caseKey => {
                    const inputObj = case1[caseKey];
                    return propNames.every(propKey =>
                        inputObj.hasOwnProperty(propKey));
                })
            )
                .to.equal(true);
        });
        test ('inputs should obey property types when converting from options to inputFilter', function () {
            // should throw error becase validators can only be of type array
            assert.throws(() => toInputFilter(({
                name: {required: true, validators: {}}
            })), Error);

            // When types are okay shouldn't throw error
            expect(
                toInputFilter({name: {required: true, validators: []}})
                    .name.validators
            )
                .to.be.instanceOf(Array);
        });
    });

    describe ('#validateInputFilter', function () {
        test ('should return expected result given both data that passes and fails input filter validation', function () {
            [truthyCasesForInputFilter1, falsyCasesForInputFilter1].forEach(casesAssocList => {
                casesAssocList.forEach(([data, expectedInvalidInputs]) => {
                    const result = validateInputFilter(inputFilter1, data),
                        foundInvalidFieldKeys = keys(expectedInvalidInputs);

                    // Truthy cases
                    if (foundInvalidFieldKeys.length === 0) {
                        expect(result.result).to.equal(true);
                        expect(keys(result.messages).length).to.equal(0);
                        // @todo messages should be null when `result.result` is
                        //  `true` might be better for the library
                    }

                    // Falsy cases
                    // Expect found-invalid-field-keys to match required criteria for each..
                    foundInvalidFieldKeys.forEach(key => {
                        expect(expectedInvalidInputs.hasOwnProperty(key)).to.equal(true);
                        expect(result.messages[key].length >= 1).to.equal(true); // has one or more messages
                    });
                });
            });

        }); // end of `test` case

        // Should return a valid InputFilterResult
        runHasPropTypes([
            [Boolean, 'result', [false, 99]],
            [Object, 'messages', [{}, 99]],
            [Object, 'validInputs', [{}, 99]],
            [Object, 'invalidInputs', [{}, 99]]
        ], validateInputFilter(inputFilter1, {}));
    });

    describe ('#validateIOInputFilter', function () {
        test ('should return expected result given both data that passes and fails input filter validation', async () => {
            [truthyCasesForInputFilter1, falsyCasesForInputFilter1].forEach(async casesAssocList => {
                casesAssocList.forEach(async ([data, expectedInvalidInputs]) => {
                    const result = await validateIOInputFilter(inputFilter1, data),
                        foundInvalidFieldKeys = keys(expectedInvalidInputs);

                    // Truthy cases
                    if (foundInvalidFieldKeys.length === 0) {
                        expect(result.result).to.equal(true);
                        expect(keys(result.messages).length).to.equal(0);
                        // @todo messages should be null when `result.result` is
                        //  `true` might be better for the library
                    }

                    // Falsy cases
                    // Expect found-invalid-field-keys to match required criteria for each..
                    foundInvalidFieldKeys.forEach(key => {
                        expect(expectedInvalidInputs.hasOwnProperty(key)).to.equal(true);
                        expect(result.messages[key].length >= 1).to.equal(true);
                    });
                });
            });

        }); // end of `test` case

        // Should return a valid InputFilterResult
        validateIOInputFilter(inputFilter1, truthyCasesForInputFilter1[0][0])
            .then(results =>
                runHasPropTypes([
                    [Boolean,   'result', [false, 99]],
                    [Object,    'messages', [{}, 99]],
                    [Array,     'validResults', [{}, 99]],
                    [Object,    'validInputs', [{}, 99]],
                    [Object,    'invalidResults', [{}, 99]],
                    [Object,    'invalidInputs', [{}, 99]]
                ], results)
            )
    });
});
