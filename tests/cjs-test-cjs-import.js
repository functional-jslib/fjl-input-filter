const instance = require('../dist/cjs/fjlInputFilter');

describe ('fjl-input-filter', function () {
    test ('should have reached this point with no errors', function () {
        expect(!!instance).toEqual(true);
    });
});
