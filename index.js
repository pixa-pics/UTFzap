"use strict";
/*
require("core-js/modules/es.array-buffer.slice.js");
require("core-js/modules/es.typed-array.uint8-array.js");
require("core-js/modules/es.typed-array.at.js");
require("core-js/modules/es.typed-array.fill.js");
require("core-js/modules/esnext.typed-array.find-last.js");
require("core-js/modules/esnext.typed-array.find-last-index.js");
require("core-js/modules/es.typed-array.set.js");
require("core-js/modules/es.typed-array.sort.js");
require("core-js/modules/esnext.typed-array.to-reversed.js");
require("core-js/modules/esnext.typed-array.to-sorted.js");
require("core-js/modules/esnext.typed-array.with.js");
require("core-js/modules/es.regexp.exec.js");
require("core-js/modules/es.string.replace.js");
require("core-js/modules/es.string.replace-all.js");
*/
/*
* The MIT License (MIT)
*
* Copyright (c) 2023 Affolter Matias
*
* Permission is hereby granted, free of charge, to any person obtaining a copy
* of this software and associated documentation files (the "Software"), to deal
* in the Software without restriction, including without limitation the rights
* to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
* copies of the Software, and to permit persons to whom the Software is
* furnished to do so, subject to the following conditions:
*
* The above copyright notice and this permission notice shall be included in all
* copies or substantial portions of the Software.
*
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
* IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
* FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
* AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
* LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
* OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
* SOFTWARE.
*/
/* BASED ON utfz-lib --> https://www.npmjs.com/package/utfz-lib */

var UTFzap = function UTFzap(memory_size, cold_function) {
  if (!(this instanceof UTFzap)) {
    return new UTFzap(memory_size, cold_function);
  }
  this.cm_ = new Uint8Array(memory_size || this.MEMORY_DEFAULT_SIZE);
  this.fns_ = Array(cold_function || this.fnsl).fill(null).map(function (v, i) {
    return i >= 3 ? UTFzap.generator(i) : v;
  });
};
UTFzap.prototype.MEMORY_CHUNCK_SIZE = 256;
UTFzap.prototype.MEMORY_DEFAULT_SIZE = 256 * 8;
UTFzap.prototype.fcc = String.fromCharCode;
UTFzap.prototype.fnsl = 66;
UTFzap.generator = function () {
  var chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  function getChar(i) {
    if (i >= chars.length) {
      var timesBigger = Math.floor(i / chars.length);
      var prefix = "_".repeat(timesBigger);
      var _char = chars[i - timesBigger * chars.length];
      return prefix + _char;
    }
    return chars[i];
  }
  function getChars(i) {
    return Array(i).fill().map(function (_, i) {
      return getChar(i);
    });
  }
  function shorten_func(func_str) {
    return func_str.replaceAll("\n", "£").replaceAll("_", "£_").replaceAll(";", ";£").replaceAll("if", "£if").replaceAll("var", "£var£").replaceAll("return", "£return£").replaceAll(" ", "").replaceAll("£", " ");
  }
  function generate(n, i) {
    if (i === void 0) {
      i = 0;
    }
    if (n == 2) {
      return "\n              " + (i === 0 ? "var" : "") + " " + getChar(i++) + " = $b[$o]|0, " + getChar(i) + " = 0, " + getChar(i + 1) + " = 0, $o=$o+1|0;\n              if (($o|0) > (_$e|0)) {\n                " + getChar(i - 1) + " = " + getChar(i - 1) + "+_$h|0;\n                return fcc(" + getChars(i - 1) + ");\n              }\n              if ((" + getChar(i - 1) + "|0) == 0) {\n                return fcc(" + getChars(i - 1) + ", _$h|0);\n              }\n              " + getChar(i - 1) + " = " + getChar(i - 1) + "+_$h|0;\n              " + (i === 0 ? "var" : "") + " " + getChar(i++) + " = $b[$o] + _$h|0; $o=$o+1|0;\n              return fcc(" + getChars(i) + ");\n            ";
    }
    return " \n            var " + getChar(i) + " = $b[$o|0], " + getChar(i + 1) + " = 0, " + getChar(i + 2) + " = 0; $o=$o+1|0;\n            if (($o|0) > (_$e|0)) {\n              " + getChar(i) + " = " + getChar(i) + "+_$h|0;\n              return fcc(" + getChars(i) + ");\n            }\n            if ((" + getChar(i) + "|0) == 0) {\n              _$n = $b[$o|0]|0;$o=$o+1|0;\n              if ((_$n|0) == (_$hC|0)) {\n                " + getChar(i) + " = _$h|0;\n              } else {\n                _$hC = _$n|0;\n                _$h = _$n << 8;\n                " + getChar(i) + " = $b[$o|0]|0;$o=$o+1|0;\n                if ((" + getChar(i) + "|0) == 0) {\n                  " + getChar(i) + " = _$h|0;\n                  $o=$o+1|0;\n                } else {\n                  " + getChar(i) + " = " + getChar(i) + "+_$h|0;\n                }\n                if (($o|0) > (_$e|0)) {\n                  return fcc(" + getChars(i) + ");\n                }\n              }\n            } else {\n              " + getChar(i) + " = " + getChar(i) + "+_$h|0;\n            }\n            " + generate(n - 1, i + 1) + "\n          ";
  }
  return function (n) {
    return new Function("$b", "$l", "$o", shorten_func("\"use strict\"; var fcc = String.fromCharCode, _$hC = 0, _$h = 0, _$n = 0, _$e = $o + $l | 0; " + generate(n)));
  };
}();
Object.defineProperty(UTFzap.prototype, 'reset', {
  get: function get() {
    return function (memory_size) {
      this.cm_ = new Uint8Array(memory_size || this.MEMORY_DEFAULT_SIZE);
    };
  }
});
Object.defineProperty(UTFzap.prototype, 'pack', {
  get: function get() {
    return function ($str, $z, $b, $o) {
      $str = "" + $str;
      $z = $z | 0;
      $o = $o | 0;
      var $s = $o | 0,
        $i = $s | 0,
        $c = 0,
        _$h = 0,
        $l = 0,
        $cH = 0;
      for (; ($i | 0) < ($z | 0); $i = $i + 1 | 0) {
        $c = $str.charCodeAt($i | 0) | 0;
        _$h = $c >> 8;
        if ((_$h | 0) != ($cH | 0)) {
          $b[$i + $o | 0] = 0;
          $b[$i + $o + 1 | 0] = _$h | 0 | 0;
          $o = $o + 2 | 0;
          $cH = _$h | 0;
        }
        $l = $c & 0xFF;
        $b[$i + $o | 0] = $l | 0 | 0;
        if (($l | 0) == 0) {
          $o = $o + 1 | 0;
          $b[$i + $o | 0] = $cH | 0;
        }
      }
      return $i - $s | 0;
    };
  }
});
Object.defineProperty(UTFzap.prototype, 'unpack', {
  get: function get() {
    return function ($b, $l, $o) {
      $l = $l | 0;
      $o = $o | 0;
      if (($l | 0) == 0) {
        return "";
      } else if (($l | 0) == 1) {
        return this.fcc($b[$o | 0] | 0);
      } else if (($l | 0) == 2) {
        var _$a = $b[$o | 0] | 0;
        $o = $o + 1 | 0;
        if ((_$a | 0) == 0) {
          return "\0";
        }
        return this.fcc(_$a | 0, $b[$o | 0] | 0);
      } else if (($l | 0) < this.fnsl) {
        return this.fns_[$l | 0]($b, $l | 0, $o | 0);
      }
      var _$e = $o + $l | 0,
        _$chC = 0,
        _$ch = 0,
        _$i = $o | 0,
        _$x = 0,
        _$n = 0,
        _$cmi = 0,
        _$str = "";
      if ((this.cm_.length | 0) < ($l * 2 | 0)) {
        this.cm_ = new Uint8Array($l * 2 | 0);
      }
      for (; (_$i | 0) < (_$e | 0); _$i = _$i + 1 | 0) {
        _$x = $b[_$i | 0] | 0;
        if (_$x) {
          this.cm_[_$cmi | 0] = _$x + _$ch | 0;
          _$cmi = _$cmi + 1 | 0;
        } else {
          _$n = $b[_$i + 1 | 0];
          _$i += 1;
          if ((_$n | 0) == (_$chC | 0)) {
            this.cm_[_$cmi | 0] = _$x + _$ch | 0;
            _$cmi = _$cmi + 1 | 0;
          } else {
            _$chC = _$n | 0;
            _$ch = _$n << 8;
          }
        }
      }
      for (_$i = 0; (_$i | 0) < (_$cmi | 0); _$i = _$i + this.MEMORY_CHUNCK_SIZE | 0) {
        _$str = _$str + this.fcc.apply(null, this.cm_.subarray(_$i | 0, Math.min(_$cmi | 0, _$i + this.MEMORY_CHUNCK_SIZE)));
      }
      return _$str;
    };
  }
});
Object.defineProperty(UTFzap.prototype, 'encode', {
  get: function get() {
    return function ($str) {
      var $b = new Uint8Array($str.length * 2 + 2);
      var $l = this.pack($str, $str.length, $b, 0);
      $b[0] = $l >> 0 & 0xff;
      $b[1] = $l >> 8 & 0xff;
      return $b.slice(0, $l + 2);
    };
  }
});
Object.defineProperty(UTFzap.prototype, 'decode', {
  get: function get() {
    return function ($b) {
      var $l = 0 | $b[0] << 0 | $b[1] << 8;
      return this.unpack($b, $l, 2);
    };
  }
});
window.UTFzap = UTFzap;
if (module) {
  module.exports = UTFzap;
}
