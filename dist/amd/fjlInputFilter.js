define(["exports", "./Input", "./InputFilter"], function (_exports, _Input, _InputFilter) {
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