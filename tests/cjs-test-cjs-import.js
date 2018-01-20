const instance = require('../dist/cjs/fjlInputFilter');
const {expect} = require('chai');

describe ('fjl-input-filter', function () {
    test ('should have reached this point with no errors', function () {
        expect(!!instance).to.equal(true);
    });
});
