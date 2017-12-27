/**
 * Created by Ely on 3/26/2016.
 */
import {typeOf, keys, isType, flip, subsequences, repeat, curry,
    isEmpty, isArray, isBoolean} from 'fjl';
import {expect, assert} from 'chai';
import {notEmptyValidator, regexValidator, stringLengthValidator,
    toValidationResult, toValidationOptions} from 'fjl-validator';
import {runValidators, runIOValidators, runFilters, runIOFilters,
    toInputOptions, validateInput, validateIOInput} from '../src/Input';
import {runHasPropTypes, log, peek} from "./utils";

describe ('sjl.input.Input', function () {

    const toSlug = x => (x + '').replace(/[^a-z\d\-_]+/gim, '-').toLowerCase(),
        trim = x => x ? (x + '').trim() : x,
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
        const breakOnFailure = false;
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
                [runValidators(inputOptionObjs[0].validators, breakOnFailure, 'hello-world'), true, 0],
                [runValidators(inputOptionObjs[1].validators, breakOnFailure, ''), false, 2],
                [runValidators(inputOptionObjs[1].validators, breakOnFailure, repeat(100, 'a').join('')), false, 1]
            ]
            .concat(
                subsequences('hello')
                    .map(x => [runValidators(inputOptionObjs[0].validators, breakOnFailure, x.join('')), true, 0])
            )
            .forEach(([rsltObj, expectedResult, expectedMsgsLen]) => {
                const {result, messages} = rsltObj;
                expect(result).to.equal(expectedResult);
                if (messages) {
                    expect(messages.length).to.equal(expectedMsgsLen);
                }
            });
        });
        test ('it should return `true` if passed in `inputOptions` doesn\'t have any validators', function () {
            expect(runValidators(null, breakOnFailure, 'hello-world').result).to.equal(true);
        });
    });

    describe ('#runIOValidators', function () {
        // Prepare some IO validators (promised based validators)
        const defaulBreakOnFailure = false,
            someIOValidateNotEmpty = x => {
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
            const expectedPromise = runIOValidators([
                        someIOValidateNotEmpty,
                        someIOValidateLength({min: 3, max: 21})
                    ], defaulBreakOnFailure, '').catch(peek);
            expect(expectedPromise).to.be.instanceOf(Promise);
        });

        test ('the retured promise should resolve to a validation result object ' +
            'whether falsy or truthy result.result', function () {
            return Promise.all([
                    runIOValidators([
                            someIOValidateNotEmpty,
                            someIOValidateLength({min: 3, max: 21})
                        ], defaulBreakOnFailure, ''),
                    runIOValidators([
                            someIOValidateNotEmpty,
                            someIOValidateLength({min: 3, max: 21})
                        ], defaulBreakOnFailure, 'hello-world')
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
            otherInputOptions = {
                name: 'otherInput',
                required: true,
                validators: [
                    regexValidator({pattern: /^\s?[a-z][a-z\d\-\s]+/})
                ],
                filters: [
                    toSlug,
                    trim
                ]
            },
            // Format `[[ValidationResult, ExpectedResultBln, ExpectedMessagesLen, ExpectedFilteredValue]]`
            results = [
                [validateInput(toInputOptions({
                    breakOnFailure: true,
                    ...baseExampleOptions
                }), ''), false, 1],

                [validateInput(toInputOptions({
                    breakOnFailure: false,
                    ...baseExampleOptions
                }), ''), false, 2],

                // less than min stringlength 5
                [validateInput(toInputOptions({
                    breakOnFailure: true,
                    ...baseExampleOptions
                }), 'abc'), false, 1],
            ]
                .concat(
                    [
                        ['Hello World', 'hello-world', baseExampleOptions],
                        ['hello-world', 'hello-world', otherInputOptions],
                        ['hello-99-WORLD_hoW_Are_yoU_doinG', 'hello-99-world_how_are_you_doing', otherInputOptions],
                        ['a9_B99_999 ', 'a9_b99_999', otherInputOptions]
                    ]
                        .map(([value, expectedValue, options]) =>
                            [validateInput(options, value), true, 0, expectedValue])
                )
        ;

        test ('should return an input validation result object', function () {
            expect(
                results.every(([validationResult]) =>
                    isValidateInputResult(validationResult)
                )
            ).to.equal(true);
        });

        test ('should return expected result object for given arguments', function () {
            results.forEach(([validationResult, expectedResultBln,
                                 expectedMsgsLen, expectedValue]) => {
                const {result, messages, value} = validationResult;
                expect(result).to.equal(expectedResultBln);
                if (!result) {
                    return;
                }
                if (messages) {
                    expect(messages.length).to.equal(expectedMsgsLen);
                }
                expect(value).to.equal(expectedValue);
            });
        });

        test ('when input has `required` set to true a `notEmptyValidator` should be added to `validators`', function () {
            const rslt = validateInput(toInputOptions({ required: true }), ''),
                {result, messages} = rslt;
            expect(result).to.equal(false);
            expect(messages.length).to.equal(1);
            expect(messages[0].indexOf('Empty')).to.equal(0);
        });
    });

    describe ('#validateIOInput', function () {
        const baseExampleOptions = {
                validators: [
                    notEmptyValidator(null),
                    stringLengthValidator({min: 5})
                ],
                filters: [toSlug]
            },
            otherInputOptions = {
                name: 'otherInput',
                required: true,
                validators: [
                    regexValidator({pattern: /^\s?[a-z][a-z\d\-\s]+/})
                ],
                filters: [
                    toSlug,
                    trim
                ]
            },
            // Format `[[ValidationResult, ExpectedResultBln, ExpectedMessagesLen, ExpectedFilteredValue]]`
            testCases = [
                [validateIOInput(toInputOptions({
                    breakOnFailure: true,
                    ...baseExampleOptions
                }), ''), false, 1, ''],

                [validateIOInput(toInputOptions({
                    breakOnFailure: false,
                    ...baseExampleOptions
                }), ''), false, 2, ''],

                // less than min stringlength 5
                [validateIOInput(toInputOptions({
                    breakOnFailure: true,
                    ...baseExampleOptions
                }), 'abc'), false, 1, 'abc'],
            ]
                .concat(
                    [
                        ['Hello World', 'hello-world', baseExampleOptions],
                        ['hello-world', 'hello-world', otherInputOptions],
                        ['hello-99-WORLD_hoW_Are_yoU_doinG', 'hello-99-world_how_are_you_doing', otherInputOptions],
                        ['a9_B99_999 ', 'a9_b99_999', otherInputOptions]
                    ]
                        .map(([value, expectedValue, options]) =>
                            [validateIOInput(options, value), true, 0, expectedValue])
                ),
            results = testCases.map(([rslts]) => rslts)
        ;

        test ('should return an input validation result object', function () {
            return Promise.all(results)
                .then(rslts => {
                    return expect(
                        rslts.every(validationResult =>
                            isValidateInputResult(validationResult)
                        )
                    ).to.equal(true)
                });
        });

        test ('should return expected result object for given arguments', async function () {
            const rslts = await Promise.all(results);
            rslts.forEach((rslt, ind) => {
                log('result:', rslt.result, rslt);
                const {result, messages, value} = rslt,
                    [_, expectedResultBln, expectedMsgsLen, expectedValue] = testCases[ind];
                log(value, expectedValue);
                const expected = [];
                expect(result).to.equal(expectedResultBln);
                if (messages) {
                    expect(messages.length).to.equal(expectedMsgsLen);
                }
                expect(value).to.equal(expectedValue);
            });
        });

        test ('when input has `required` set to true a `notEmptyValidator` should be added to `validators`', function () {
            return validateIOInput(toInputOptions({ required: true }), '')
                .then(({result, messages}) =>
                    Promise.all([
                        expect(result).to.equal(false),
                        expect(messages.length).to.equal(1),
                        expect(messages[0].indexOf('Empty')).to.equal(0)
                    ])
                );
        });
    });
});
