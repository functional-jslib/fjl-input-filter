"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.defaultErrorHandler = void 0;

/**
 * Same as `console.error`.  Used by *IO variant methods (methods that work with promises) in fjlInputFilter;
 * E.g., used as the error catcher on promises returned from IO processes.
 * @function module:fjlInputFilter.defaultErrorHandler
 * @returns {void}
 */
var defaultErrorHandler = console.error.bind(console);
exports.defaultErrorHandler = defaultErrorHandler;