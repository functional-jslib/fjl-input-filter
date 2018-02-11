import {typeOf, keys, map, isType, flip, subsequences, repeat, curry,
    all, isEmpty, isObject, isArray, isBoolean, unfoldr} from 'fjl';
import {expect, assert} from 'chai';
import {notEmptyValidator, regexValidator, stringLengthValidator,
    toValidationResult, toValidationOptions} from 'fjl-validator';
import {runHasPropTypes, log, peek} from "./utils";
import {
    toInputFilterResult,
    toInputFilter,
    toArrayMap,
    fromArrayMap,
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

    describe ('Utility functions', function () {
        const charCodeToCharArrayMap = unfoldr(
            (charCode, ind) => ind === 26 ? undefined :
                [[charCode, String.fromCharCode(charCode)], ++charCode]
            ,
            'a'.charCodeAt(0)
            ),
            charCodeToCharMap = charCodeToCharArrayMap.reduce((agg, [charCode, char]) => {
                agg[charCode] = char;
                return agg;
            }, {});

        // log (charCodeToCharArrayMap, charCodeToCharMap);

        describe ('#toArrayMap', function () {
            test ('should convert an object to an array map', () => {
                // Ensure map was converted to array map properly
                expect(all(([charCode, char], ind) => {
                        const [charCode1, char1] = charCodeToCharArrayMap[ind];
                        return `${charCode1}` === charCode && char1 === char;
                    }, toArrayMap(charCodeToCharMap)
                ))
                    .to.equal(true);
            });
            test ('should return an empty an array when receiving an empty object', () => {
                const result = toArrayMap({});
                expect(result).to.be.instanceOf(Array);
                expect(result.length).to.equal(0);
            });
            test ('Should throw an error when receiving `undefined` or `null`', () => {
                assert.throws(toArrayMap, Error);
                assert.throws(() => toArrayMap(null), Error);
            });
        });

        describe ('#fromArrayMap', function () {
            test ('should return an object from an array map', () => {
                const result = fromArrayMap(charCodeToCharArrayMap);
                expect(isObject(result)).to.equal(true);
                expect(
                    all(([charCode, char]) =>
                        result[charCode] === char,
                        charCodeToCharArrayMap
                    )
                )
                    .to.equal(true);
            });

            test ('should return an empty object when receiving an empty array', () => {
                const result = fromArrayMap([]);
                expect(isObject(result)).to.equal(true);
                expect(keys(result).length).to.equal(0);
            });

            test ('should throw an error when receiving `null` and/or `undefined', () => {
                assert.throws(fromArrayMap, Error);
                assert.throws(() => fromArrayMap(null), Error);
            });
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
                        expect(result.messages[key].length >= 1).to.equal(true);
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
        // Input filter
        // Expected values
        // Incoming values
        const inputFilter = toInputFilter({
                name: {required: true},
                email: {required: true,
                    // Cheap email validate
                    validators: [
                        stringLengthValidator({min: 3, max: 55}), // string length error messages
                        x => {                                    // Invalid email error messages
                            let result = false;
                            if (!x || typeof x !== 'string') {
                                return {result, messages: ['`email` should be a non-empty string']}
                            }
                            const atSym = '@',
                                indexOfAt = x.indexOf(atSym);
                            if (indexOfAt !== x.lastIndexOf(atSym)) {
                                return {result, messages: ['Invalid email']};
                            }
                            return {result: true, messages: []};
                        }
                    ],
                    filters: [x => (x + '').toLowerCase()]},
                subject: {
                    validators: [],
                    filters: []
                },
                message: {},
                zipCode: {},
                phoneNumber: {}
            }),
            // [[inputFilterOptions, expectedValues]]
            incomingValues = [[{
                name: 'Hello World',
                email: 'hI@HeLlO.CoM',
                subject: '',
                message: '',
                zipCode: null,
                phoneNumber: null
            }, {name: 'Hello World', email: 'hi@hello.com'}]];

        test ('should return expected result', function () {
            incomingValues.forEach(([data, expected]) => {
                validateIOInputFilter(inputFilter, data)
                    .then(filtered => {
                        // log(JSON.parse(JSON.stringify(filtered)));
                        const expectedKeys = keys(expected);
                        expect(expectedKeys.every(key => filtered.validInputs.hasOwnProperty(key))).to.equal(true);
                        // expect(.every(key => filtered.validInputs[key].value === expected[key]))

                    })
            });
            // log(JSON.stringify(filteredInputFilter));
        });

        // Should return a valid InputFilterResult
        validateIOInputFilter(inputFilter, incomingValues[0][0])
            .then(results =>
                runHasPropTypes([
                    [Boolean, 'result', [false, 99]],
                    [Object, 'messages', [{}, 99]],
                    [Object, 'validInputs', [{}, 99]],
                    [Object, 'invalidInputs', [{}, 99]]
                ], results.map(([key, result]) => result))
            )
    });
});
