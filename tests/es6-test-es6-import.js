import * as instance from '../dist/es6-module/fjl-input-filter';

describe ('fjl-input-filter', function () {
    test ('should have reached this point with no errors', function () {
        expect(!!instance).toEqual(true);
    });
    test ('should have at least one of the expected methods defined on itself', () => {
        expect(instance.Input).toBeInstanceOf(Function);
    });
});
