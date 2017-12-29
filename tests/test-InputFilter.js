import {typeOf, keys, isType, flip, subsequences, repeat, curry,
    isEmpty, isArray, isBoolean} from 'fjl';
import {expect, assert} from 'chai';
import {notEmptyValidator, regexValidator, stringLengthValidator,
    toValidationResult, toValidationOptions} from 'fjl-validator';
import {runValidators, runIOValidators, runFilters, runIOFilters,
    toInputOptions, validateInput, validateIOInput} from '../src/Input';
import {runHasPropTypes, log, peek} from "./utils";
import {toInputFilterResult} from "../src/InputFilter";

describe ('InputFilter', function () {
    describe ('toInputFilterResult', function () {
       test ('should have more tests');
    });
    describe ('validateInputFilter', function () {
        test ('should have more tests');
    });
});
