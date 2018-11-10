# fjl-input-filter
Input filter validation functions - These allows you to create input and input-filter objects that can be used (by included utility functions)
to easily validate a body of input fields quickly and easily (see usage examples further below).

## In this readme:
- [Basic idea](#basic-idea)
- [Usage](#usage)
- [Api](#api)
- [Constructors](#constructors)
- [Virtual Types](#virtual-types)
- [External Virtual Types](#external-virtual-types)
- [License](#license)

## Basic idea:
**Validators** - Functions that validate a given input and return a validation result.
**Filters** - Functions that take a value and give you a 'possibly' transformed value.
**Inputs** - Objects that contain rules used for validation (breakOnFailure, a list of validators, a list of filters etc.)
**InputFilters** - Collection of input objects that can be validated together as a whole.
(see usage example(s) below): 

## Usage:

### Importing code:
Default exports are available via 'cjs' and/or 'es6-module' formats.
Other formats are available via './dist' folder (iife, es6-module, umd, amd, and cjs) 

### Usage in code:
#### Functional approach:
```
// Example input filter obj:
const contactFormFilter = toInputFilter({
        name: {
            required: true,
            validators: [stringLengthValidator({min: 2, max: 89})]
        },
        email: {
            required: true,
            validators: [
                stringLengthValidator({min: 3, max: 55}), // string length error messages
                // Cheap email validate (for example)
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
                },
            ],
            filters: [x => (x + '').toLowerCase()]
        },
        subject: {
            validators: [stringLengthValidator({max: 128})],
            filters: [htmlEncodeEntities] // example validator doesn't exist yet
        },
        message: {
            validators: [stringLengthValidator({max: 128})],
            filters: [htmlEncodeEntities]
        }
    }),
    
    validateForm = e => {
        e.preventDefault();
        const form = e.currentTarget;
        
        // Run validation
        const validationResult = validateInputFilter(contactFormInputFilter, dataFromContactForm),
            {result, validResults, invalidResults, messages} = validationResult;
            
        if (!result) {
            // Assign error messages underneath form elements (for example...)
            invalidResults.forEach(([key, vResult]) => {
                const messageElm = formElement.elements[key].querySelector('+ .messages');
                messageElm.innerHTML = '';
                messageElm.innerHTML = vResult.messages.join(' <br />');
            });
            // Mabye add custom error message above form etc...
            return;
        }
        
        // Else
        // Proceed with form submission
        // ...etc...
        const serializable = 
            validResults.reduce((agg, [key, resultObj]) => {
                agg[key] = resultObj.value;
                return agg;
            }, {});
            
        // Example Send data to server
        post('/contact-us', JSON.stringify(serializable), (req, res) => {
            // ... handle `req`/`res`
        }, (err) => console.error(err));
        
        // Else (using validation on server - send data to some process, io or other etc.)
    }
```

## Api:
### `validateInputFilter(inputFilter, incomingData)`
### `validateIOInputFilter(inputFilter, incomingData, ioErrorHandler)`
### `validateInput(inputObj, value)`
### `validateIOInput(inputObj, value, ioErrorHandler)`
### `toInputFilter(inputsObj, breakOnFailure {Boolean}, out = {})`
### `toInputFilterResult(resultObj, out = {})`
### `toInputValidationResult(resultObj)`
### `toInput(inputOptions, out = {})`

#### Constructors
### `Input(options)`
#### Methods
- **`validate(data) : InputValidationResult`**
- **`validateIO(data) : Promise.<InputValidationResult>`**

### `InputFilter(inputsObj, breakOnFailure {Boolean})`
#### Methods
- **`validate(data) : InputFilterResult`**
- **`validateIO(data) : Promise.<InputFilterResult>`**

## Virtual Types
### InputValidationResult
### InputFilterResult

## External Virtual Types
**See:** fjl-validator repo/module
### ValidationResult
### ValidatorOptions

## Resources
### Inspiration
- fjl-validator: https://github.com/functional-jslib/fjl-validator
- fjl-filter (WIP): https://github.com/functional-jslib/fjl-filter
- Zend/InputFilter: https://docs.zendframework.com/zend-inputfilter/intro/

## Pre-Requisites
### For Node:
node v8+ .

### For Browser:
Ecmascript 5+ and up.

## Development
- See `package.json - scripts property`
- Develop in './src'
- Write tests in './tests'

## Test
`npm test`

## License
BSD 3.0+

