# fjl-input-filter (ALPHA)
Input filter validation functions - These allows you to create input and input-filter objects that can be used (by included utility functions)
to easily validate a body of input fields quickly and easily (see usage examples further below).

## Basic idea
**Validators** - Functions that return an object in the form `{result: {Boolean}, message: {Array.<String>}}`.
  So basically validators are functions that validate the given input and return a result object.
  
**Filters** - Filters are functions that take a value and give you a value (value could be transformed by filter or
can be returned as is).

**Inputs** - Objects that can contain a list of validators and/or filters to validate against.

**InputFilters** - Collection of input objects that can be validated as a whole.. 

## Usage:
### Functional approach:
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
### validateInputFilter
### validateIOInputFilter
### validateInput
### validateIOInput
### toInputFilter
### toInputFilterResult
### toInputValidationResult
### toInput

#### Constructors
### `Input(options)`
#### Methods
- **`validate(data) : InputValidationResult`**
- **`validateIO(data) : Promise.<InputValidationResult>`**

### `InputFilter(inputsObj)`
#### Methods
- **`validate(data) : InputFilterResult`**
- **`validateIO(data) : Promise.<InputFilterResult>`**

#### Virtual types
### InputValidationResult
### InputFilterResult

## License
BSD 3.0+
