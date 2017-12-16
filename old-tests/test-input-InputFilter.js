/**
 * Created by Ely on 3/26/2016.
 */

describe ('sjl.input.InputFilter', function () {

    // ~~~ STRIP ~~~
    // This part gets stripped out when
    // generating browser version of test(s).
    'use strict';
    var chai = require('chai'),
        sjl = require('../old-src/fjlInputFilter'),
        expect = chai.expect;
    // These variables get set at the top IIFE in the browser.
    // ~~~ /STRIP ~~~

    var FilterChain =           sjl.filter.FilterChain,
        ValidatorChain =        sjl.validator.ValidatorChain,
        Input =                 sjl.input.Input,
        InputFilter =           sjl.input.InputFilter,
        RegexValidator =        sjl.validator.RegexValidator,
        NumberValidator =       sjl.validator.NumberValidator,
        NotEmptyValidator =     sjl.validator.NotEmptyValidator,
        AlnumValidator =        sjl.validator.AlnumValidator,
        BooleanFilter =         sjl.filter.BooleanFilter,
        StringToLowerFilter =   sjl.filter.StringToLowerFilter,
        StringTrimFilter =      sjl.filter.StringTrimFilter,
        SlugFilter =            sjl.filter.SlugFilter,
        StripTagsFilter =       sjl.filter.StripTagsFilter;

    describe ('Constructor', function () {
        it ('should be a subclass of `sjl.stdlib.Extendable`.', function () {
            expect((new InputFilter())).to.be.instanceof(sjl.stdlib.Extendable);
        });
        it ('should construct with no parameters passed.', function () {
            expect((new InputFilter())).to.be.instanceof(InputFilter);
        });
        it ('should populate all properties passed in via hash object.', function () {
            // var options = {
            //     alias: 'hello',
            //     breakOnFailure: true,
            //     fallbackValue: 'hello world'
            // },
            //     inputFilter = new Input(options);
            // Object.keys(options).forEach(function (key) {
            //     expect(inputFilter[key]).to.equal(options[key]);
            // });
        });
    });

    describe ('Properties.', function () {
        var inputFilter = new InputFilter();
        [
            ['data', Object],
            ['inputs', Object],
            ['invalidInputs', Object],
            ['validInputs', Object],
            ['messages', Object]
        ]
            .forEach(function (args) {
            it('should have an `' + args[0] + '` property.', function () {
                var isValidProp = sjl.classOfIsMulti.apply(sjl, [inputFilter[args[0]]].concat(args.slice(1)));
                expect(isValidProp).to.equal(true);
            });
        });
    });

    describe ('Methods', function () {

        describe('Interface', function () {
            var inputFilter = new InputFilter();
            [
                'addInput',
                'addInputs',
                'getInput',
                'hasInput',
                'isInput',
                'removeInput',
                'isValid',
                'validate',
                'filter',
                'getRawValues',
                'getValues',
                'getMessages',
                'mergeMessages',
                'clearMessages',
                'clearInvalidInputs',
                'clearValidInputs'
            ]
                .forEach(function (method) {
                    it('should have a `' + method + '` method.', function () {
                        expect(inputFilter[method]).to.be.instanceof(Function);
                    });
                });
        });

        describe ('#addInput', function () {
            it ('should be able to add a valid inputHash as an `Input`.', function () {
                var inputFilter = new InputFilter(),
                    inputHash = {
                        alias: 'someInputName'
                    },
                    result = inputFilter.addInput(inputHash);
                expect(result).to.equal(inputFilter);
                expect(result.inputs[inputHash.alias]).to.be.instanceof(Input);
            });
            it ('should be able to add an `Input` object as an input.', function () {
                var inputFilter = new InputFilter(),
                    input = new Input({
                        alias: 'someInputName'
                    }),
                    result = inputFilter.addInput(input);
                expect(result).to.equal(inputFilter);
                expect(result.inputs[input.alias]).to.equal(input);
            });
            it ('should throw a type error when input hash is\'nt properly formed.', function () {
                var inputFilter = new InputFilter(),
                    input = {},
                    caughtError;
                try {
                    inputFilter.addInput(input);
                }
                catch (e) {
                    caughtError = e;
                }
                expect(caughtError).to.be.instanceof(TypeError);
            });
            it ('should throw a type error if input hash is anything other than an Object or an Input object.', function () {
                var inputFilter = new InputFilter(),
                    caughtError;
                [Array, function () {}, 99, true, undefined, null].forEach(function (input) {
                    try {
                        inputFilter.addInput(input);
                    }
                    catch (e) {
                        caughtError = e;
                    }
                    expect(caughtError).to.be.instanceof(TypeError);
                });
            });

        });

        describe ('#addInputs', function () {
            it ('should be able to add input hashes to input objects on it\'s `inputs` property and return itself after doing so.', function () {
                var inputsHash = {
                    someInput1: {
                        required: true
                    },
                    someInput2: {
                        required: true
                    },
                    someInput3: {
                        required: true
                    },
                },
                    inputFilter = new InputFilter(),
                    result;

                // Ensure `inputs` has no keys
                expect(Object.keys(inputFilter.inputs).length).to.equal(0);

                // Run operation
                result = inputFilter.addInputs(inputsHash);

                // Ensure operation returned owner
                expect(result).to.equal(inputFilter);



                // Ensure inputs were added
                Object.keys(inputsHash).forEach(function (key) {
                    expect(inputFilter.inputs.hasOwnProperty(key)).to.equal(true);
                    expect(inputFilter.inputs[key]).to.be.instanceof(Input);
                });
            });
        });

        describe ('#hasInputs', function () {
            it ('should return `true` when input filter has input.', function () {
                var inputsHash = {
                        someInput1: {
                            required: true
                        },
                        someInput2: {
                            required: true
                        },
                        someInput3: {
                            required: true
                        },
                    },
                    inputFilter;

                inputFilter = new InputFilter({inputs: inputsHash});

                Object.keys(inputsHash).forEach(function (key) {
                    expect(inputFilter.hasInput(key)).to.equal(true);
                });

            });
            it ('should return `false` when input filter has input.', function () {
                var inputFilter = new InputFilter();
                expect(inputFilter.hasInput('hello')).to.equal(false);
            });
            it ('should throw a type error when key is empty or not a string.', function () {
                var inputFilter = new InputFilter();
                [undefined, '', []].forEach(function (value) {
                    var caughtError;
                    try {
                        expect(inputFilter.hasInput(value));
                    }
                    catch (e) {
                        caughtError = e;
                    }
                    expect(caughtError).to.be.instanceof(TypeError);
                });
            });

        });

        describe ('#isInput', function () {
            it ('should return `true` when value is an `Input`.', function () {
                var inputFilter = new InputFilter();
                expect(inputFilter.isInput(new Input())).to.equal(true);
            });
            it ('should return `false` when value is not an `Input`.', function () {
                var inputFilter = new InputFilter();
                expect(inputFilter.isInput({})).to.equal(false);
                expect(inputFilter.isInput()).to.equal(false);
            });
        });

        describe ('#removeInput', function () {
            it ('should be able to remove a defined input.', function () {
                var inputFilter = new InputFilter({inputs: {hello: {alias: 'hello'}}}),
                    addInput = inputFilter.inputs.hello;
                // Ensure input was added
                expect(inputFilter.inputs.hello).to.be.instanceof(Input);

                // Perform operation
                expect(inputFilter.removeInput('hello')).to.equal(addInput);

                // Check that operation was successful
                expect(Object.keys(inputFilter.inputs).length).to.equal(0);
            });
            it ('should return `Undefined` when input to remove was not found.', function () {
                var inputFilter = new InputFilter();
                expect(inputFilter.removeInput()).to.equal(undefined);
            });
        });

        describe ('#isValid, #validate', function () {
            var inputFilter = new InputFilter({
                inputs: {stringInput: {alias: 'stringInput', required: true}},
                data: {stringInput: 99}
            });
            it ('should return true when inputs are valid.', function () {
                expect(inputFilter.isValid()).to.equal(true);
                sjl.forEach(inputFilter.inputs, function (input, key, inputs) {
                    expect(input.messages.length).to.equal(0);
                });
            });
            it ('should return false when inputs are not valid.', function () {

            });
        });

        describe ('#filter', function () {
            var inputFilter = new InputFilter();
            it ('should return itself.', function () {
                expect(inputFilter.filter()).to.equal(inputFilter);
            });
        });

        describe ('#getRawValues', function () {
            var inputFilter = new InputFilter();
            it ('should return an object.', function () {
                expect(inputFilter.getRawValues()).to.be.instanceof(Object);
            });
        });

        describe ('#getValues', function () {
            var inputFilter = new InputFilter();
            it ('should return an object.', function () {
                expect(inputFilter.getValues()).to.be.instanceof(Object);
            });
        });

        describe ('#getMessages', function () {
            var inputFilter = new InputFilter();
            it ('should return an object.', function () {
                expect(inputFilter.getMessages()).to.be.instanceof(Object);
            });
        });

        describe ('#mergeMessages', function () {
            var inputFilter = new InputFilter({
                    messages: {stringInput: ['hello world']}
                }),
                otherMessages = {stringInput: ['hello']},
                result = inputFilter.mergeMessages(otherMessages);
            it ('should return self.', function () {
                expect(result).to.equal(inputFilter);
            });
            it ('should have a messages array with the length of the passed in messages array.', function () {
                expect(inputFilter.messages.stringInput.length).to.equal(2);
            });
        });

        describe ('#clearMessages', function () {
            var inputFilter = new InputFilter({messages: {stringInput: ['some message here.']}}),
                result = inputFilter.clearMessages();
            it ('should return itself.', function () {
                expect(result).to.equal(inputFilter);
            });
            it ('Messages should be clear.', function () {
                expect(Object.keys(inputFilter.messages).length).to.equal(0);
            });
        });

        describe ('#clearInputs', function () {
            var inputFilter = new InputFilter(),
                result;
            inputFilter.inputs.helloWorld = new Input();
            result = inputFilter.clearInputs();
            it ('should return itself.', function () {
                expect(result).to.equal(inputFilter);
            });
            it ('should empty `inputs` object.', function () {
                expect(Object.keys(inputFilter.inputs).length).to.equal(0);
            });
        });

        describe ('#clearValidInputs', function () {
            var inputFilter = new InputFilter(),
                result;
            inputFilter.validInputs.helloWorld = new Input();
            result = inputFilter.clearValidInputs();
            it ('should return itself.', function () {
                expect(result).to.equal(inputFilter);
            });
            it ('should empty `validInputs` object.', function () {
                expect(Object.keys(inputFilter.validInputs).length).to.equal(0);
            });
        });

        describe ('#clearInvalidInputs', function () {
            var inputFilter = new InputFilter(),
                result;
            inputFilter.invalidInputs.helloWorld = new Input();
            result = inputFilter.clearInvalidInputs();
            it ('should return itself.', function () {
                expect(result).to.equal(inputFilter);
            });
            it ('should empty `invalidInputs` object.', function () {
                expect(Object.keys(inputFilter.invalidInputs).length).to.equal(0);
            });
        });

        describe ('#_addInputOnInputs', function () {
            var inputFilter = new InputFilter();
            it ('should return it\'s owner.', function () {
                expect(inputFilter._addInputOnInputs({alias: 'hello'}, inputFilter.inputs)).to.equal(inputFilter);
            });
            it ('should be able to convert an hash object to an `Input`.', function () {
                inputFilter._addInputOnInputs({alias: 'hello'}, inputFilter.inputs);
                expect(inputFilter.inputs.hello).to.be.instanceof(Input);
                expect(Object.keys(inputFilter.inputs).length).to.equal(1);
            });
            it ('should be able add an `Input` object.', function () {
                var input = new Input({alias: 'hello'});
                inputFilter._addInputOnInputs(input, inputFilter.inputs);
                expect(inputFilter.inputs.hello).to.equal(input);
                expect(Object.keys(inputFilter.inputs).length).to.equal(1);
            });
            it ('should throw a type error on malformed input hashes and objects.', function () {
                var caughtError;
                [undefined, {}].forEach(function (value) {
                    try {
                        inputFilter._addInputOnInputs(value, inputFilter.inputs);
                    }
                    catch (e) {
                        caughtError = e;
                    }
                    expect(caughtError).to.be.instanceof(TypeError);
                });
            });
        });

        describe ('#_setDataOnInputs', function () {
            var inputFilter = new InputFilter({
                inputs: {
                    input1: {alias: 'input1'},
                    input2: {alias: 'input2'},
                    input3: {alias: 'input3'},
                }
            }),
                inputValues = {
                    input1: 'hello',
                    input2: false,
                    input3: 99
                },
                result = inputFilter._setDataOnInputs(inputValues, inputFilter.inputs);

            it ('should return passed in inputs object.', function () {
                expect(result).to.equal(inputFilter.inputs);
            });

            it ('should give inputs their designated values.', function () {
                sjl.forEach(inputValues, function (value, key) {
                    expect(inputFilter.inputs[key].rawValue).to.equal(value);
                });
            });

            it ('should throw an error when `data` is not an Object.', function () {
                var caughtError;
                try {
                    inputFilter._setDataOnInputs(undefined, inputFilter.inputs);
                }
                catch (e) {
                    caughtError = e;
                }
                expect(caughtError).to.be.instanceof(TypeError);
            });

            it ('should throw an error when `inputsOn` is not an Object.', function () {
                var caughtError;
                try {
                    inputFilter._setDataOnInputs({}, undefined);
                }
                catch (e) {
                    caughtError = e;
                }
                expect(caughtError).to.be.instanceof(TypeError);
            });
        });

        describe ('#_setInputsOnInputs', function () {
            var inputFilter = new InputFilter(),
                inputs = {
                    input1: {alias: 'input1'},
                    input2: {alias: 'input2'},
                    input3: {alias: 'input3'}
                },
                result = inputFilter._setInputsOnInputs(inputs, inputFilter.inputs);

            it ('should return the passed in `inputs` object to set inputs on.', function () {
                expect(result).to.equal(inputFilter.inputs);
            });
            Object.keys(inputs).forEach(function (key) {
                it ('should have added an input for key "' + key + '".', function () {
                    expect(inputFilter.inputs[key]).to.be.instanceof(Input);
                });
            });
        });

        describe ('#_inputHashToInput', function () {
            var inputFilter = new InputFilter(),
                inputs = {
                    input1: {alias: 'input1'},
                    input2: {alias: 'input2'},
                    input3: {alias: 'input3'}
                };
            sjl.forEachInObj(inputs, function (value, key) {
                var result = inputFilter._inputHashToInput(value);
                it ('should return and `Input` object from input hash.', function () {
                    expect(result).to.be.instanceof(Input);
                });
                it ('should have returned and `Input` object with the correct `alias` applied to it.', function () {
                    expect(result.alias).to.equal(key);
                });
            });
        });

        describe ('#_validateInputs', function () {
            var inputFilter = new InputFilter({inputs: {
                    stringInput: {
                        alias: 'stringInput',
                        validators: [
                            new NotEmptyValidator(),
                            new RegexValidator({pattern: /[a-z][a-z\d\-\s]+/})
                        ],
                        filters: [
                            new StringToLowerFilter(),
                            new StringTrimFilter()
                            //new SlugFilter()
                        ]
                    }
                }
                }),
                inputValues = {
                    stringInput: [
                        ['hello-world', 'hello-world'],
                        ['hello-99-WORLD_hoW_Are_yoU_doinG', 'hello-99-world_how_are_you_doing'],
                        [' a9_B99_999 ', 'a9_b99_999']
                    ]
                };

            // When `value` is set directly
            sjl.forEach(inputFilter.inputs, function (input, key) {
                inputValues[key].forEach(function (args) {
                    it ('should return true when inputs validate.', function () {
                        inputFilter.data = {stringInput: args[0]};
                        var result = inputFilter._validateInputs(inputFilter.inputs, inputFilter.data);
                        expect(result).to.equal(true);
                    });
                });
            });
        });

        describe ('#_validateInput', function () {
            var inputFilter = new InputFilter({inputs: {
                        stringInput: {
                            alias: 'stringInput',
                            validators: [
                                new NotEmptyValidator(),
                                new RegexValidator({pattern: /[a-z][a-z\d\-\s]+/})
                            ],
                            filters: [
                                new StringToLowerFilter(),
                                new StringTrimFilter()
                                //new SlugFilter()
                            ]
                        }
                    }
                }),
                inputValues = {
                    stringInput: [
                        ['hello-world', 'hello-world'],
                        ['hello-99-WORLD_hoW_Are_yoU_doinG', 'hello-99-world_how_are_you_doing'],
                        [' a9_B99_999 ', 'a9_b99_999']
                    ]
                };

            // When `value` is set directly
            sjl.forEach(inputFilter.inputs, function (input, key) {
                inputValues[key].forEach(function (args) {
                    it ('should return true for inputs that validate', function () {
                        inputFilter.data = {stringInput: args[0]};
                        var result = inputFilter._validateInput(inputFilter.inputs.stringInput);
                        expect(result).to.equal(true);
                        expect(inputFilter.inputs.stringInput.value).to.equal(args[1]);
                        expect(inputFilter.inputs.stringInput.rawValue).to.equal(args[0]);
                    });
                });
            });

        });

        describe ('#_filterInputs', function () {
            var inputFilter = new InputFilter({inputs: {
                    stringInput: {
                        alias: 'stringInput',
                        validators: [
                            new NotEmptyValidator(),
                            new RegexValidator({pattern: /[a-z][a-z\d\-\s]+/})
                        ],
                        filters: [
                            new StringToLowerFilter(),
                            new StringTrimFilter()
                            //new SlugFilter()
                        ]
                    }
                }
                }),
                inputValues = {
                    stringInput: [
                        ['hello-world', 'hello-world'],
                        ['hello-99-WORLD_hoW_Are_yoU_doinG', 'hello-99-world_how_are_you_doing'],
                        [' a9_B99_999 ', 'a9_b99_999']
                    ]
                };

            // When `value` is set directly
            sjl.forEach(inputFilter.inputs, function (input, key) {
                inputValues[key].forEach(function (args) {
                    it ('should call filter on passed inputs.', function () {
                        inputFilter.data = {stringInput: args[0]};
                        var result = inputFilter._filterInputs(inputFilter.inputs);
                        expect(result).to.equal(inputFilter);
                        expect(input.value).to.equal(args[1]);
                        expect(input.rawValue).to.equal(args[0]);
                    });
                });
            });
        });

        describe ('#_filterInput', function () {
            var inputFilter = new InputFilter({inputs: {
                    stringInput: {
                        alias: 'stringInput',
                        validators: [
                            new NotEmptyValidator(),
                            new RegexValidator({pattern: /[a-z][a-z\d\-\s]+/})
                        ],
                        filters: [
                            new StringToLowerFilter(),
                            new StringTrimFilter()
                            //new SlugFilter()
                        ]
                    }
                }
                }),
                inputValues = {
                    stringInput: [
                        ['hello-world', 'hello-world'],
                        ['hello-99-WORLD_hoW_Are_yoU_doinG', 'hello-99-world_how_are_you_doing'],
                        [' a9_B99_999 ', 'a9_b99_999']
                    ]
                };

            // When `value` is set directly
            sjl.forEach(inputFilter.inputs, function (input, key) {
                inputValues[key].forEach(function (args) {
                    it ('should filter passed in input\'s value.', function () {
                        inputFilter.data = {stringInput: args[0]};
                        var result = inputFilter._filterInput(input);
                        expect(result).to.equal(input);
                        expect(input.value).to.equal(args[1]);
                        expect(input.rawValue).to.equal(args[0]);
                    });
                });
            });
        });

        describe ('#_validatorsFromInputHash', function () {
            it ('should return an empty array for inputs that don\'t have any validators.', function () {
                var inputFilter = new InputFilter({
                    inputs: {
                        input1: {alias: 'input1'},
                        input2: {alias: 'input2'},
                        input3: {alias: 'input3'}
                    }
                });
                sjl.forEachInObj(inputFilter.inputs, function (value, key) {
                    var result = inputFilter._validatorsFromInputHash(value);
                    expect(result).to.be.instanceof(Array);
                    expect(result.length).to.equal(0);
                });
            });
            it ('should return validators for inputs that have them.', function () {
                var inputFilter = new InputFilter({
                        inputs: {
                            input1: {
                                alias: 'input1',
                                validators: [
                                    new RegexValidator(),
                                    new AlnumValidator()
                                ]
                            },
                            input2: {alias: 'input2'},
                            input3: {alias: 'input3'}
                        }
                    });
                sjl.forEachInObj(inputFilter.inputs, function (value, key, inputs) {
                    var result = inputFilter._validatorsFromInputHash(value);
                    expect(result).to.be.instanceof(Array);
                    expect(result.length).to.equal(inputs[key].validators.length);
                });

            });
        });

        describe ('#_filtersFromInputHash', function () {
            it ('should return an empty array for inputs that don\'t have any filters.', function () {
                var inputFilter = new InputFilter({
                    inputs: {
                        input1: {alias: 'input1'},
                        input2: {alias: 'input2'},
                        input3: {alias: 'input3'}
                    }
                });
                sjl.forEachInObj(inputFilter.inputs, function (value, key) {
                    var result = inputFilter._filtersFromInputHash(value);
                    expect(result).to.be.instanceof(Array);
                    expect(result.length).to.equal(0);
                });
            });
            it ('should return filters for inputs that have them.', function () {
                var inputFilter = new InputFilter({
                    inputs: {
                        input1: {
                            alias: 'input1',
                            filters: [
                                new BooleanFilter(),
                                new StringToLowerFilter()
                            ]
                        },
                        input2: {alias: 'input2'},
                        input3: {alias: 'input3'}
                    }
                });
                sjl.forEachInObj(inputFilter.inputs, function (value, key, inputs) {
                    var result = inputFilter._filtersFromInputHash(value);
                    expect(result).to.be.instanceof(Array);
                    expect(result.length).to.equal(inputs[key].filters.length);
                });

            });

        });

    });

});
