(function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(["exports"], factory);
  } else if (typeof exports !== "undefined") {
    factory(exports);
  } else {
    var mod = {
      exports: {}
    };
    factory(mod.exports);
    global.Utils = mod.exports;
  }
})(typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : this, function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.defaultErrorHandler = void 0;

  /**
   * Same as `console.error`.  Used by *IO variant methods (methods that work with promises) in fjlInputFilter;
   * E.g., used as the error catcher on promises returned from IO processes.
   * @function module:fjlInputFilter.defaultErrorHandler
   * @returns {void}
   */
  var defaultErrorHandler = console.error.bind(console);
  _exports.defaultErrorHandler = defaultErrorHandler;
});