import {typeOf, keys, map, isType, flip, subsequences, repeat, curry,
    isEmpty, isArray, isBoolean} from 'fjl';
import {expect, assert} from 'chai';
import {notEmptyValidator, regexValidator, stringLengthValidator,
    toValidationResult, toValidationOptions} from 'fjl-validator';
import {runValidators, runIOValidators, runFilters, runIOFilters,
    toInputOptions, validateInput, validateIOInput} from '../src/Input';
import {runHasPropTypes, log, peek} from "./utils";
import {toInputFilterResult, toInputFilter} from "../src/InputFilter";

describe ('InputFilter', function () {
    describe ('toInputFilterResult', function () {
        // Ensure properties on inputFilter default
       [toInputFilterResult(), toInputFilterResult({})]
           .forEach(inputOptions => runHasPropTypes([
               [Boolean, 'result', [false, 99]],
               [Object, 'messages', [{}, 99]],
               [Object, 'validInputs', [{}, 99]],
               [Object, 'invalidInputs', [{}, 99]]
           ], inputOptions));
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
                    const inputOptions = case1[caseKey];
                    return propNames.every(propKey =>
                        inputOptions.hasOwnProperty(propKey));
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

    describe ('validateInputFilter', function () {
        test ('should have more tests');
        test ('should return an "input-filter-result"', function () {

        });
    });
});
