import {typeOf, keys, map, isType, flip, subsequences, repeat, curry,
    isEmpty, isArray, isBoolean} from 'fjl';
import {expect, assert} from 'chai';
import {notEmptyValidator, regexValidator, stringLengthValidator,
    toValidationResult, toValidationOptions} from 'fjl-validator';
import {runValidators, runIOValidators, runFilters, runIOFilters,
    toInput, validateInput, validateIOInput} from '../src/Input';
import {runHasPropTypes, log, peek} from "./utils";
import {toInputFilterResult, toInputFilter, validateInputFilter, validateIOInputFilter} from "../src/InputFilter";

describe ('InputFilter', function () {
    describe ('#toInputFilterResult', function () {
        // Ensure properties on inputFilter default
       [toInputFilterResult({result: true}), toInputFilterResult()]
           .forEach(inputObj => !log(inputObj.result, inputObj) && runHasPropTypes([
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
                const filtered = validateInputFilter(inputFilter, data),
                    expectedKeys = keys(expected);
                expect(expectedKeys.every(key => filtered.validInputs.hasOwnProperty(key))).to.equal(true);
                // expect(.every(key => filtered.validInputs[key].value === expected[key]))
                //         .to.equal(true);
            });
            // log(JSON.stringify(filteredInputFilter));
        });

        // Should return a valid InputFilterResult
        runHasPropTypes([
            [Boolean, 'result', [false, 99]],
            [Object, 'messages', [{}, 99]],
            [Object, 'validInputs', [{}, 99]],
            [Object, 'invalidInputs', [{}, 99]]
        ], validateInputFilter(inputFilter, {}));
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
