
In-line summary docs follow:


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
