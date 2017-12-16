/**
 * Created by Ely on 3/26/2016.
 */
import {typeOf, keys, isType, flip} from 'fjl';
import {expect, assert} from 'chai';
import NotEmptyValidator from '../src/validator/NotEmptyValidator'
import RegexValidator from '../src/validator/RegexValidator'
import Input, {validate} from '../src/input/Input';

describe ('sjl.input.Input', function () {

    describe ('#Constructor', function () {
        it ('should construct successfully without params.', function () {
            expect((new Input())).to.be.instanceof(Input);
        });
        it ('should construct an instance with the `name` property populated when first parameter is a string.', function () {
            let name = 'hello';
            expect((new Input(name)).name).to.equal(name);
        });
        it ('should populate all properties passed in via hash object.', function () {
            let options = {
                    name: 'hello',
                    breakOnFailure: true,
                    fallbackValue: 'hello world'
                },
                input = new Input(options);
            keys(options).forEach(function (key) {
                expect(input[key]).to.equal(options[key]);
            });
        });
    });

    describe ('#Interface', function () {
        let input = new Input();
        ['isValid', 'validate'].forEach(function (method) {
            it('should have a `' + method + '` method.', function () {
                expect(input[method]).to.be.instanceof(Function);
            });
        });
    });

    describe ('#Properties.', function () {
        let input = new Input();
        [
            ['name', String],
            ['required', Boolean],
            ['breakOnFailure', Boolean],
            ['filters', Array],
            ['validators', Array]
        ].forEach(function (args) {
            it('should have an `' + args[0] + '` property.', function () {
                let isValidProp = isType(args[1], input[args[0]]);
                expect(isValidProp).to.equal(true);
            });
        });

    });

    describe ('#validate', function () {
        it ('should return a validation result', function () {
            const rslt = validate(0, {});
            ['result', 'value', 'messsages'].forEach(key => expect(rslt.hasOwnProperty(key)));
        });
    });

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
                        //new SlugFilter()
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
                it ('should return true when value is tested directly from `value` and passes validation.', function () {
                    inputObj.value = args[0];
                    expect(inputObj.isValid()).to.equal(true);
                });
                it ('should set `value` to filtered value.', function () {
                    expect(inputObj.value).to.equal(args[1]);
                });
                it ('should have `rawValue` to the initial value to test.', function () {
                    expect(inputObj.rawValue).to.equal(args[0]);
                });
                it ('should return false when value doesn\'t pass validation.', function () {
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
                it ('should return true when value is tested directly from `rawValue`.', function () {
                    inputObj.rawValue = args[0];
                    expect(inputObj.isValid()).to.equal(true);
                });
                it ('should set `value` to filtered value.', function () {
                    expect(inputObj.value).to.equal(args[1]);
                });
                it ('should have `rawValue` to the initial value to test.', function () {
                    expect(inputObj.rawValue).to.equal(args[0]);
                });
            });
        });

        // When value to test is passed in
        keys(inputs).forEach(key => {
            const input = inputs[key];
            inputValues[key].forEach(args => {
                let inputObj = new Input(input);
                it ('should return true when value to is directly passed in and validates.', function () {
                    expect(inputObj.isValid(args[0])).to.equal(true);
                });
                it ('should set `value` to filtered value.', function () {
                    expect(inputObj.value).to.equal(args[1]);
                });
                it ('should have `rawValue` to the initial value to test.', function () {
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
            it ('should return expected filtered value for filter set.', function () {
                let result = input.filter(args[0]);
                expect(result).to.equal(args[1]);
            });
        });
    });*/

});
