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
require("core-js/modules/es.string.replace-all.js");*/

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
    this.fns_ = new Array(cold_function || this.fnsl).fill(null).map(function (v, i){ return (i >= 3 ? UTFzap.generator(i) : v); });
};

UTFzap.prototype.MEMORY_CHUNCK_SIZE = 256;
UTFzap.prototype.MEMORY_DEFAULT_SIZE = 256 * 8;
UTFzap.prototype.fcc = String.fromCharCode;
UTFzap.prototype.fnsl = 66;

UTFzap.generator = (function (){
    var chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    function getChar(i) {
        if (i >= chars.length) {
            var timesBigger = Math.floor(i / chars.length);
            var prefix = "_".repeat(timesBigger);
            var char = chars[i - timesBigger * chars.length];
            return prefix + char;
        }
        return chars[i];
    }

    function getChars(i) {
        return new Array(i).fill().map(function (_, i){ return getChar(i); });
    }

    function shorten_func(func_str) {
        return func_str
            .replaceAll("\n", "£").replaceAll("_", "£_").replaceAll(";", ";£").replaceAll("if", "£if").replaceAll("var", "£var£").replaceAll("return", "£return£")
            .replaceAll(" ", "")
            .replaceAll("£", " ")
    }

    function generate(n, i = 0) {
        if (n == 2) {
            return `
              ${i===0?"var":""} ${getChar(i++)} = $b[$o]|0, ${getChar(i)} = 0, ${getChar(i+1)} = 0, $o=$o+1|0;
              if (($o|0) > (_$e|0)) {
                ${getChar(i - 1)} = ${getChar(i - 1)}+_$h|0;
                return fcc(${getChars(i - 1)});
              }
              if ((${getChar(i - 1)}|0) == 0) {
                return fcc(${getChars(i - 1)}, _$h|0);
              }
              ${getChar(i - 1)} = ${getChar(i - 1)}+_$h|0;
              ${i===0?"var":""} ${getChar(i++)} = $b[$o] + _$h|0; $o=$o+1|0;
              return fcc(${getChars(i)});
            `;

        }
        return ` 
            var ${getChar(i)} = $b[$o|0], ${getChar(i+1)} = 0, ${getChar(i+2)} = 0; $o=$o+1|0;
            if (($o|0) > (_$e|0)) {
              ${getChar(i)} = ${getChar(i)}+_$h|0;
              return fcc(${getChars(i)});
            }
            if ((${getChar(i)}|0) == 0) {
              _$n = $b[$o|0]|0;$o=$o+1|0;
              if ((_$n|0) == (_$hC|0)) {
                ${getChar(i)} = _$h|0;
              } else {
                _$hC = _$n|0;
                _$h = _$n << 8;
                ${getChar(i)} = $b[$o|0]|0;$o=$o+1|0;
                if ((${getChar(i)}|0) == 0) {
                  ${getChar(i)} = _$h|0;
                  $o=$o+1|0;
                } else {
                  ${getChar(i)} = ${getChar(i)}+_$h|0;
                }
                if (($o|0) > (_$e|0)) {
                  return fcc(${getChars(i)});
                }
              }
            } else {
              ${getChar(i)} = ${getChar(i)}+_$h|0;
            }
            ${generate(n - 1, i + 1)}
          `;
    }

    return function(n) {
        return new Function("$b", "$l", "$o", shorten_func(`"use strict"; var fcc = String.fromCharCode, _$hC = 0, _$h = 0, _$n = 0, _$e = $o + $l | 0; ${generate(n)}`));
    };
})();

Object.defineProperty(UTFzap.prototype, 'reset', {
    get: function get() {
        return function (memory_size){ this.cm_ = new Uint8Array(memory_size || this.MEMORY_DEFAULT_SIZE); }
    }
});

Object.defineProperty(UTFzap.prototype, 'pack', {
    get: function get() {
        return function(str, length, buf, offset) {
            const start = offset;
            let currHigh = 0;
            for (let i = 0; i < length; i++) {
                const code = str.charCodeAt(i);
                const high = code >> 8;
                if (high !== currHigh) {
                    buf[i + offset++] = 0;
                    buf[i + offset++] = high;
                    currHigh = high;
                }
                const low = code & 0xff;
                buf[i + offset] = low;
                if (!low) {
                    buf[i + ++offset] = currHigh;
                }
            }
            return length + offset - start;
        }
    }
});

Object.defineProperty(UTFzap.prototype, 'unpack', {
    get: function get() {
        return function(buf, length, offset) {

            if (length === 0) {
                return "";
            } else if (length === 1) {
                return this.fcc(buf[offset]);
            } else if (length === 2) {
                const a = buf[offset++];
                if (a === 0) {
                    return "\0";
                }
                return  this.fcc(a, buf[offset]);
            } else if (length <= 65) {
                return this.f[length](buf, length, offset);
            }
            const end = offset + length;
            let currHighCode = 0;
            let currHigh = 0;
            const codes = [];
            for (let i = offset; i < end; i++) {
                const curr = buf[i];
                if (curr) {
                    codes.push(curr + currHigh);
                } else {
                    const next = buf[i + 1];
                    i += 1;
                    if (next === currHighCode) {
                        codes.push(curr + currHigh);
                    } else {
                        currHighCode = next;
                        currHigh = next << 8;
                    }
                }
            }
            return this.fcc.apply(null, codes);
        };
    }
});


Object.defineProperty(UTFzap.prototype, 'encode', {
    get: function get() {
        return function ($str) {
            var $b = new Uint8Array($str.length*3+2);
            var $l = this.pack($str, $str.length, $b, 2);
            $b[0] = ($l >> 0) & 0xff;
            $b[1] = ($l >> 8) & 0xff;
            return $b.slice(0, $l+2);
        }
    }
});

Object.defineProperty(UTFzap.prototype, 'decode', {
    get: function get() {
        return function ($b) {
            var $l = 0 | $b[0] << 0 | $b[1] << 8;
            return this.unpack($b, $l+2, 2);
        }
    }
});

window.UTFzap = UTFzap;

if(module) {
    module.exports = UTFzap;
}
