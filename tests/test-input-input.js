/**
 * Created by Ely on 3/26/2016.
 */
import {typeOf, keys, isType, flip, subsequences, repeat, curry,
    isEmpty, isArray, isBoolean} from 'fjl';
import {expect, assert} from 'chai';
import {notEmptyValidator, regexValidator, stringLengthValidator,
    toValidationResult, toValidationOptions} from 'fjl-validator';
import {runValidators, runIOValidators, runFilters, runIOFilters, toInputOptions, validateInput} from '../src/Input';
import {runHasPropTypes, log, peek} from "./utils";

describe ('sjl.input.Input', function () {

    const toSlug = x => (x + '').replace(/[^a-z\d\-_]+/gim, '-').toLowerCase(),
        isValidateInputResult = rsltObj =>
            ['result', 'messages', 'value', 'rawValue', 'filteredValue', 'obscuredValue']
                .every(key => rsltObj.hasOwnProperty(key));

    describe ('#toInputOptions', function () {
        describe ('#InputOptions', function () {
            // Ensure properties on inputOptions default
            [toInputOptions(), toInputOptions({})]
                .forEach(inputOptions => runHasPropTypes([
                    [String, 'name', ['', 99]],
                    [Boolean, 'required', [true, 99]],
                    [Boolean, 'breakOnFailure', [true, 99]],
                    [Array, 'filters', [[], 99]],
                    [Array, 'validators', [[], 99]]
                ], inputOptions));
        });
        test ('should return an instance with the `name` property populated when `options` parameter is a string.', function () {
            let name = 'hello';
            expect((toInputOptions(name)).name).to.equal(name);
        });
        test ('should populate all properties passed in via hash object.', function () {
            let options = {
                    name: 'hello',
                    breakOnFailure: true,
                    fallbackValue: 'hello world'
                },
                input = toInputOptions(options);
            keys(options).forEach(function (key) {
                expect(input[key]).to.equal(options[key]);
            });
        });
    });

    describe ('#runValidators', function () {
        test ('it should return a `ValidationResult` object with the expected results', function () {
            const inputOptionObjs = [
                    {
                        validators: [
                            stringLengthValidator({min: 0, max: 99})
                        ],
                    },
                    {
                        validators: [
                            notEmptyValidator(null),
                            stringLengthValidator({min: 3, max: 99})
                        ]
                    }
                ];
            [
                // [ValidationResult, ExpectedResultResult, MessagesLength]
                [runValidators(inputOptionObjs[0], 'hello-world'), true, 0],
                [runValidators(inputOptionObjs[1], ''), false, 2],
                [runValidators(inputOptionObjs[1], repeat(100, 'a').join('')), false, 1]
            ]
                .concat(
                    subsequences('hello-world')
                        .map(x => [runValidators(inputOptionObjs[0], x.join('')), true, 0])
                )
                .forEach(([{result, messages}, expectedResult, expectedMsgsLen]) => {
                    expect(result).to.equal(expectedResult);
                    expect(messages.length).to.equal(expectedMsgsLen);
                });
        });
        test ('it should return `true` if passed in `inputOptions` doesn\'t have any validators', function () {
            expect(runValidators({}, 'hello-world').result).to.equal(true);
        });
    });

    describe ('#runIOValidators', function () {
        // Prepare some IO validators (promised based validators)
        const someIOValidateNotEmpty = x => {
                const result = !isEmpty(x),
                    messages = [];
                if (!result) {
                    messages.push('Empty not allowed');
                }
                return Promise.resolve({result, messages});
            },
            someIOValidateLength = curry((options, x) =>
                Promise.resolve(stringLengthValidator(options, x))
            );

        test ('it should return a promise whether truthy result or falsy result', function () {
            const expectedPromise = runIOValidators({
                    validators: [
                        someIOValidateNotEmpty,
                        someIOValidateLength({min: 3, max: 21})
                    ]
                }, '').catch(peek);
            expect(expectedPromise).to.be.instanceOf(Promise);
        });

        test ('the retured promise should resolve to a validation result object whether falsy or truthy result.result', function () {
            return Promise.all([
                    runIOValidators({
                        validators: [
                            someIOValidateNotEmpty,
                            someIOValidateLength({min: 3, max: 21})
                        ]
                    }, ''),
                    runIOValidators({
                        validators: [
                            someIOValidateNotEmpty,
                            someIOValidateLength({min: 3, max: 21})
                        ]
                    }, 'hello-world')
                ])
                .then(results => {
                    const [falsyResult, truthyResult] = results;
                    expect(falsyResult.result).to.equal(false);
                    expect(truthyResult.result).to.equal(true);
                    expect(falsyResult.messages.length).to.equal(2);
                    expect(truthyResult.messages.length).to.equal(0);
                    results.forEach(rslt => {
                        expect(isArray(rslt.messages)).to.equal(true);
                        expect(isBoolean(rslt.result)).to.equal(true);
                    });
                }, peek);
        });
    });

    describe ('#runFilters', function () {
        it ('should run all filters in compositional order', function () {
            expect(runFilters([
                x => (x + '').trim(),
                x => (x + '').toLowerCase(),
                x => (x + '').replace(/[^a-z\d\-_\s]+/gim, '')
            ], '  Hello#-#World ')).to.equal('hello-world');
        });
    });

    describe ('#runIOFilters', function () {
        test ('should run all filters in compositional order', function () {
            return runIOFilters([
                x => (x + '').trim(),
                x => Promise.resolve((x + '').toLowerCase()),
                x => (x + '').replace(/[^a-z\d\-_\s]+/gim, '')
            ], '  Hello#-#World ')
                .then(x => expect(x).to.equal('hello-world'));
        });
    });

    describe ('#validateInput', function () {
        const baseExampleOptions = {
                validators: [
                    notEmptyValidator(null),
                    stringLengthValidator({min: 5})
                ],
                filters: [toSlug]
            },
            // Array<Array<ValidationResult, ExpectedResultBln, ExpectedMessagesLen, ExpectedFilteredValue>>
            results = [
                [validateInput(toInputOptions({
                    breakOnFailure: true,
                    ...baseExampleOptions
                }), ''), false, 1],
                [validateInput(toInputOptions({
                    breakOnFailure: false,
                    ...baseExampleOptions
                }), ''), false, 2],
                [validateInput(toInputOptions({
                    breakOnFailure: true,
                    ...baseExampleOptions
                }), 'abc'), false, 1],            // less than min stringlength 5
                [validateInput(toInputOptions({
                    breakOnFailure: false,
                    ...baseExampleOptions
                }), 'Hello World'), true, 0, 'hello-world']     // greater than min stringlength 5
            ]
        ;

        test ('should return an input validation result object', function () {
            expect(
                results.every(([validationResult]) =>
                    isValidateInputResult(validationResult)
                )
            ).to.equal(true);
        });

        test ('should return expected result object for given arguments', function () {
            results.forEach(([validationResult, expectedResultBln, expectedMsgsLen, expectedValue]) => {
                const {result, messages, value} = validationResult;
                expect(messages.length).to.equal(expectedMsgsLen);
                expect(result).to.equal(expectedResultBln);
                if (!result) {
                    return;
                }
                expect(value).to.equal(expectedValue);
            });
        });
    });

    /*describe ('#validateInput', function () {
        test ('should return a promise', function () {
            expect(validateInput({}, 0)).to.be.instanceOf(Promise);
        });
        test ('returned promise should resolve to a validation result', function () {
            return validateInput({}, 0)
                .then(result =>
                    ['result', 'value', 'messsages']
                        .map(key => expect(result.hasOwnProperty(key)))
                )
        });
    });
    */

    /*describe ('#isValid, #validate', function () {
        let inputs = {
                stringInput: {
                    name: 'stringInput',
                    validators: [
                        NotEmptyValidator,
                        new RegexValidator({pattern: /^\s?[a-z][a-z\d\-\s]+/})
                    ],
                    filters: [
                        // new StringToLowerFilter(),
                        // new StringTrimFilter()
                        // new SlugFilter()
                    ]
                }
            },
            inputValues = {
                // @type Array[String (passing value), String (filtered value), {*} Failing value]
                stringInput: [
                    ['hello-world', 'hello-world', {}],
                    ['hello-99-WORLD_hoW_Are_yoU_doinG', 'hello-99-world_how_are_you_doing', {hello: 'hello'}],
                    ['a9_B99_999 ', 'a9_b99_999', new Map([['hello', 'hello-value']])]
                ]
            };

        // When `value` is set directly
        keys(inputs).forEach(function (key) {
            const input = inputs[key];
            inputValues[key].forEach(function (args) {
                let inputObj = new Input(input);
                test ('should return true when value is tested directly from `value` and passes validation.', function () {
                    inputObj.value = args[0];
                    expect(inputObj.isValid()).to.equal(true);
                });
                test ('should set `value` to filtered value.', function () {
                    expect(inputObj.value).to.equal(args[1]);
                });
                test ('should have `rawValue` to the initial value to test.', function () {
                    expect(inputObj.rawValue).to.equal(args[0]);
                });
                test ('should return false when value doesn\'t pass validation.', function () {
                    let inputObj2 = new Input(input);
                    inputObj2.value = args[2];
                    expect(inputObj2.isValid()).to.equal(false);
                    expect(inputObj2.messages.length).to.equal(1);
                    // console.log(inputObj2.messages);
                });
            });
        });

        // When `rawValue` is set directly
        keys(inputs).forEach(function (key) {
            const input = inputs[key];
            inputValues[key].forEach(function (args) {
                let inputObj = new Input(input);
                test ('should return true when value is tested directly from `rawValue`.', function () {
                    inputObj.rawValue = args[0];
                    expect(inputObj.isValid()).to.equal(true);
                });
                test ('should set `value` to filtered value.', function () {
                    expect(inputObj.value).to.equal(args[1]);
                });
                test ('should have `rawValue` to the initial value to test.', function () {
                    expect(inputObj.rawValue).to.equal(args[0]);
                });
            });
        });

        // When value to test is passed in
        keys(inputs).forEach(key => {
            const input = inputs[key];
            inputValues[key].forEach(args => {
                let inputObj = new Input(input);
                test ('should return true when value to is directly passed in and validates.', function () {
                    expect(inputObj.isValid(args[0])).to.equal(true);
                });
                test ('should set `value` to filtered value.', function () {
                    expect(inputObj.value).to.equal(args[1]);
                });
                test ('should have `rawValue` to the initial value to test.', function () {
                    expect(inputObj.rawValue).to.equal(args[0]);
                });
            });
        });
    });*/

    /*describe ('#filter', function () {
        let input = new Input({
                filters: [
                    new StringToLowerFilter(),
                    new StringTrimFilter()
                ]
            }),
            argsToTest = [
                [' Hello World ', 'hello world'],
                ['Hello World ', 'hello world'],
                [' Hello World', 'hello world'],
                ['Hello World', 'hello world'],
            ];
        argsToTest.forEach(function (args) {
            test ('should return expected filtered value for filter set.', function () {
                let result = input.filter(args[0]);
                expect(result).to.equal(args[1]);
            });
        });
    });*/

});
