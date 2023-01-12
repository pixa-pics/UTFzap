"use strict";

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

    this.reusable_memory_ = new Uint16Array((memory_size & 0xFFFFFF) || this.MEMORY_DEFAULT_SIZE);
    this.cold_functions_length_ = (cold_function & 0xFF) || this.fnsl;
    
    // Expand cold function cache
    if(this.cold_functions_length_ > UTFzap.coldFunctionsCache.length) {
        while(UTFzap.coldFunctionsCache.length < this.cold_functions_length_){
            UTFzap.coldFunctionsCache.push(UTFzap.generator(UTFzap.coldFunctionsCache.length));
        }
    }
    
    this.cold_functions_ = UTFzap.coldFunctionsCache;
    this.fcc_ = UTFzap.fcc;
    this.fcca_ = UTFzap.fcca;
};

UTFzap.fcc = function(n) {return String.fromCharCode(n|0)};
UTFzap.fcca = function(a) {return String.fromCharCode.apply(null,a)};

UTFzap.generator = (function (){

    function getChar(i) {
        return "$x"+Math.abs(i).toString(32);
    }

    function getChars(i) {
        return new Array(i).fill(null).map(function (_, i){ return getChar(i)});
    }

    function shorten_func(func_str) {
        return func_str.split(" ").filter(function (word){return word !== "" && word !== " ";}).join(" ");
    }

    function generate(n, i = 0) {
        if (n == 2) {
            return `
              let ${getChar(i++)} = buf[offset++];
              if (offset > end) {
                ${getChar(i - 1)} += high;
                return String.fromCharCode(${getChars(i - 1)});
              }
              if (${getChar(i - 1)} === 0) {
                return String.fromCharCode(${getChars(i - 1)}, high);
              }
              ${getChar(i - 1)} += high;
              let ${getChar(i++)} = buf[offset++] + high;
              return String.fromCharCode(${getChars(i)});
            `;
        }else {

            return `
            let ${getChar(i)} = buf[offset++];
            if (offset > end) {
              ${getChar(i)} += high;
              return String.fromCharCode(${getChars(i)});
            }
            if (${getChar(i)} === 0) {
              next = buf[offset++];
              if (next === highCode) {
                ${getChar(i)} = high;
              } else {
                highCode = next;
                high = next << 8;
                ${getChar(i)} = buf[offset++];
                if (${getChar(i)} === 0) {
                  ${getChar(i)} = high;
                  offset++
                } else {
                  ${getChar(i)} += high;
                }
                if (offset > end) {
                  return String.fromCharCode(${getChars(i)});
                }
              }
            } else {
              ${getChar(i)} += high;
            }
            ${generate(n - 1, i + 1)}
          `;
        }
    }

    return function(n) {
        var main = generate(n);
        var body = shorten_func(`var highCode = 0; var high = 0; var next; end = offset + length; ${main}`);
        return new Function("buf", "length", "offset", body);
    };
})();

UTFzap.coldFunctionsCache = [];
UTFzap.lazyComputeColdFunctions = function (batch_size, batch_number) {

    batch_size = batch_size || 8;
    batch_number = batch_number || 16;
    var start_generate = 3;
    var store = UTFzap.coldFunctionsCache;
    var generator = UTFzap.generator;
    var tasks = [];
    var sum = 0;
    var stacked = 0;
    var handle = null;

    requestIdleCallback = requestIdleCallback || function (handler) {
        var start = Date.now();
        return setTimeout(function (start, handler) {
            handler({
                didTimeout: false,
                timeRemaining: function () {return Math.max(0, 50.0 - (Date.now() - start));}
            });
        }, 1, start, handler);
    };

    cancelIdleCallback = cancelIdleCallback || function(id)  {clearTimeout(id);};

    function enqueueTask(handler, data) {
        tasks.push({handler: handler, data: data,});
        sum++;
        if (!handle) {
            handle = requestIdleCallback(runTaskQueue, { timeout: 1000 });
        }
    }

    function runTaskQueue(deadline) {
        while ((deadline.timeRemaining() > 0 || deadline.didTimeout) && tasks.length) {
            var task = tasks.shift();
            stacked++;
            task.handler(task.data);
        }

        if (tasks.length) {
            handle = requestIdleCallback(runTaskQueue, { timeout: 1000 });
        } else {
            handle = 0;
        }
    }

    function getColdFunctions(parameters) {
        parameters.callback(
            new Array(parameters.to-parameters.from).fill(parameters.from).map(function (start, offset){
                return parameters.generator(start+offset);
            }), store);
    }

    function addColdFunctions(functions, store){
        functions.forEach(function(f){
            store.push(f);
        });
    }

    function decodeTechnoStuff(batch_size, batch_number, addColdFunctions, store, generator, getColdFunctions, enqueueTask) {

        for (var i = 0; i < batch_number; i++) {
            var data = {
                callback: addColdFunctions,
                store: store,
                generator: generator,
                from: start_generate+i*batch_size,
                to: (i+1)*batch_size+start_generate
            };
            enqueueTask(getColdFunctions, data);
        }
    }
    for(var i = 0; i < start_generate; i++) {
        store.push(null);
    }
    decodeTechnoStuff(batch_size, batch_number, addColdFunctions, store, generator, getColdFunctions, enqueueTask);
};

UTFzap.prototype.MEMORY_CHUNCK_SIZE = 256;
UTFzap.prototype.MEMORY_DEFAULT_SIZE = 256 * 8;
UTFzap.prototype.fnsl = 128;

Object.defineProperty(UTFzap.prototype, 'reset', {
    get: function get() {
        return function (memory_size){ this.reusable_memory_ = new Uint16Array(memory_size || this.MEMORY_DEFAULT_SIZE); }
    }
});

Object.defineProperty(UTFzap.prototype, 'pack', {
    get: function get() {
        return function (str, length, buf, offset) {
            var start = offset;
            var currHigh = 0;
            for (var i = 0; i < length; i++) {
                var code = str.charCodeAt(i);
                var high = code >> 8;
                if (high !== currHigh) {
                    buf[i + offset++] = 0;
                    buf[i + offset++] = high;
                    currHigh = high;
                }
                var low = code & 0xff;
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
                return this.fcc_(buf[offset]);
            } else if (length === 2) {
                var a = buf[offset++];
                if (a === 0) {
                    return "\0";
                }
                return this.fcc_(a, buf[offset]);
            } else if (length < this.cold_functions_length_) {
                return this.cold_functions_[length](buf, length, offset);
            }
            var end = offset + length;
            var currHighCode = 0;
            var currHigh = 0;
            var codes_index = 0;
            var codes_number = end-offset;

            if(codes_number > this.reusable_memory_.length){
                this.reusable_memory_ = new Uint16Array(codes_number*1.5|0);
            }

            for (var i = offset; i < end; i++) {
                var curr = buf[i];
                if (curr) {
                    this.reusable_memory_[codes_index] = curr + currHigh & 0xFFFF;
                    codes_index++;
                } else {
                    var next = buf[i + 1];
                    i += 1;
                    if (next === currHighCode) {
                        this.reusable_memory_[codes_index] = curr + currHigh & 0xFFFF;
                        codes_index++;
                    } else {
                        currHighCode = next;
                        currHigh = next << 8;
                    }
                }
            }

            return this.fcca_(this.reusable_memory_.subarray(0, codes_index));
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

UTFzap.lazyComputeColdFunctions();

if(typeof module !== "undefined") {
    module.exports = UTFzap;
}
