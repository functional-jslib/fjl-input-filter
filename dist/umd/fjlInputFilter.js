(function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(["exports", "./Input", "./InputFilter"], factory);
  } else if (typeof exports !== "undefined") {
    factory(exports, require("./Input"), require("./InputFilter"));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod.exports, global.Input, global.InputFilter);
    global.fjlInputFilter = mod.exports;
  }
})(this, function (_exports, _Input, _InputFilter) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.keys(_Input).forEach(function (key) {
    if (key === "default" || key === "__esModule") return;
    Object.defineProperty(_exports, key, {
      enumerable: true,
      get: function get() {
        return _Input[key];
      }
    });
  });
  Object.keys(_InputFilter).forEach(function (key) {
    if (key === "default" || key === "__esModule") return;
    Object.defineProperty(_exports, key, {
      enumerable: true,
      get: function get() {
        return _InputFilter[key];
      }
    });
  });
});