"use strict";

require("core-js/modules/es.array-buffer.slice.js");
require("core-js/modules/es.typed-array.uint16-array.js");
require("core-js/modules/es.typed-array.at.js");
require("core-js/modules/es.typed-array.fill.js");
require("core-js/modules/esnext.typed-array.find-last.js");
require("core-js/modules/esnext.typed-array.find-last-index.js");
require("core-js/modules/es.typed-array.set.js");
require("core-js/modules/es.typed-array.sort.js");
require("core-js/modules/esnext.typed-array.to-reversed.js");
require("core-js/modules/esnext.typed-array.to-sorted.js");
require("core-js/modules/esnext.typed-array.with.js");
require("core-js/modules/es.typed-array.uint8-array.js");
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

// String compression class
var UTFzap = function UTFzap(memory_size, cold_function) {
  if (!(this instanceof UTFzap)) {
    return new UTFzap(memory_size, cold_function);
  }
  this.reusable_memory_ = new Uint16Array(memory_size & 0xFFFFFF || this.MEMORY_DEFAULT_SIZE); // Cache max size is 2^12
  this.cold_functions_length_ = cold_function & 0xFF || this.fnsl; // Cold function max length is 2^8

  // Expand cold function cache for all instance of this class
  // Cold function which will be later pushed on to future instance too
  if (this.cold_functions_length_ > UTFzap.coldFunctionsCache.length) {
    while (UTFzap.coldFunctionsCache.length < this.cold_functions_length_) {
      UTFzap.coldFunctionsCache.push(UTFzap.generator(UTFzap.coldFunctionsCache.length));
    }
  }

  // Set inner references to cached tiny functions and cold functions ons
  this.cold_functions_ = UTFzap.coldFunctionsCache.slice(0, this.cold_functions_length_);
  this.fcc_ = UTFzap.fcc;
  this.fcca_ = UTFzap.fcca;
};

// Tiny utils function
UTFzap.fcc = function fcc(n) {
  return String.fromCharCode(n | 0);
};
UTFzap.fcca = function fcca(a) {
  return String.fromCharCode.apply(null, a);
};

// Cold functions generator
UTFzap.generator = function () {
  function getChar(i) {
    return "$x" + Math.abs(i).toString(16).toUpperCase();
  }
  function getChars(i) {
    return Array(i).fill(null).map(function (_, i) {
      return getChar(i);
    }).join("|0, ");
  }
  function getVarChars(i) {
    return Array(i).fill(null).map(function (_, i) {
      return getChar(i);
    }).join("=0, ");
  }
  function shorten_func(func_str) {
    return func_str.split(" ").filter(function (word) {
      return word !== "" && word !== " ";
    }).join(" ");
  }
  function generate(n, i = 0) {
    if (n == 2) {
      return `
              ${getChar(i++)} = buf[offset++]|0;
              if ((offset|0) > (end|0)) {
                ${getChar(i - 1)} = ${getChar(i - 1)} + high | 0;
                return String.fromCharCode(${getChars(i - 1)});
              }
              if (${getChar(i - 1)} == 0) {
                return String.fromCharCode(${getChars(i - 1)}, high);
              }
              ${getChar(i - 1)} = ${getChar(i - 1)} + high | 0;
              ${getChar(i++)} = buf[offset++] + high|0;
              return String.fromCharCode(${getChars(i)});`;
    }
    return `
            ${getChar(i)} = buf[offset++]|0;
            if ((offset|0) > (end|0)) {
              ${getChar(i)} = ${getChar(i)} + high | 0;
              return String.fromCharCode(${getChars(i)});
            }
            if (${getChar(i)} == 0) {
              next = buf[offset++];
              if ((next|0) == (highCode|0)) {
                ${getChar(i)} = high;
              } else {
                highCode = (next|0)
                high = next << 8;
                ${getChar(i)} = buf[offset++]|0;
                if (${getChar(i)} === 0) {
                  ${getChar(i)} = high;
                  offset++
                } else {
                  ${getChar(i)} = ${getChar(i)} + high | 0;
                }
                if ((offset|0) > (end|0)) {
                  return String.fromCharCode(${getChars(i)});
                }
              }
            } else {
              ${getChar(i)} = ${getChar(i)} + high | 0;
            }
            ${generate(n - 1, i + 1)}`;
  }
  return function (n) {
    var main = generate(n);
    var body = shorten_func(`var ${getVarChars(n)} = 0, highCode = 0, high = 0, next; end = offset + length|0; ${main}`); // $t -> 0: HighCode. 1: high, 2: next, 3: end, 4: offset, 5: length
    return new Function("buf", "length", "offset", body);
  };
}();
UTFzap.coldFunctionsCache = []; // Cold functions cache for any generated functions above the third
UTFzap.lazyComputeColdFunctions = function lazyComputeColdFunctions(batch_size, batch_number) {
  // Function that use available computation power to fill the cold function cache when it is too busy

  batch_size = batch_size || 8;
  batch_number = batch_number || 8;
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
        timeRemaining: function () {
          return Math.max(0, 50.0 - (Date.now() - start));
        }
      });
    }, 1, start, handler);
  };
  cancelIdleCallback = cancelIdleCallback || function (id) {
    clearTimeout(id);
  };
  function enqueueTask(handler, data) {
    tasks.push({
      handler: handler,
      data: data
    });
    sum++;
    if (!handle) {
      handle = requestIdleCallback(runTaskQueue, {
        timeout: 1000
      });
    }
  }
  function runTaskQueue(deadline) {
    while ((deadline.timeRemaining() > 0 || deadline.didTimeout) && tasks.length) {
      var task = tasks.shift();
      stacked++;
      task.handler(task.data);
    }
    if (tasks.length) {
      handle = requestIdleCallback(runTaskQueue, {
        timeout: 1000
      });
    } else {
      handle = 0;
    }
  }
  function getColdFunctions(parameters) {
    parameters.callback(Array(parameters.to - parameters.from).fill(parameters.from).map(function (start, offset) {
      return parameters.generator(start + offset);
    }), store);
  }
  function addColdFunctions(functions, store) {
    functions.forEach(function (f) {
      store.push(f);
    });
  }
  function decodeTechnoStuff(batch_size, batch_number, addColdFunctions, store, generator, getColdFunctions, enqueueTask) {
    for (var i = 0; (i | 0) < (batch_number | 0); i++) {
      var data = {
        callback: addColdFunctions,
        store: store,
        generator: generator,
        from: start_generate + i * batch_size,
        to: (i + 1) * batch_size + start_generate
      };
      enqueueTask(getColdFunctions, data);
    }
  }
  for (var i = 0; (i | 0) < (start_generate | 0); i++) {
    store.push(function () {});
  }
  decodeTechnoStuff(batch_size, batch_number, addColdFunctions, store, generator, getColdFunctions, enqueueTask);
};

// Parameters of memory and default cold function length embed per instance
UTFzap.prototype.MEMORY_CHUNCK_SIZE = 256;
UTFzap.prototype.MEMORY_DEFAULT_SIZE = 256 * 8;
UTFzap.prototype.fnsl = 64;

// Reset the instance memory to the default memory settings
Object.defineProperty(UTFzap.prototype, 'reset', {
  get: function get() {
    return function (memory_size) {
      this.reusable_memory_ = new Uint16Array(memory_size || this.MEMORY_DEFAULT_SIZE);
    };
  }
});

// Provide one character from a char code, this code below returns a function
Object.defineProperty(UTFzap.prototype, 'fcc', {
  get: function get() {
    return this.fcc_;
  }
});

// Provide multiple character from an array of char codes, this code below returns a function
Object.defineProperty(UTFzap.prototype, 'string_from_memory', {
  get: function get() {
    return function (start, stop) {
      start = start | 0;
      stop = stop | 0;
      var i = start | 0,
        str = "";
      for (; (i | 0) < (stop | 0); i = i + this.MEMORY_CHUNCK_SIZE | 0) {
        str = str + this.fcca_(this.reusable_memory_.subarray(i | 0, Math.min(stop | 0, i + this.MEMORY_CHUNCK_SIZE | 0) | 0));
      }
      return str;
    };
  }
});

// Provide how many cold function are cached in our instance
Object.defineProperty(UTFzap.prototype, 'cold_functions_length', {
  get: function get() {
    return this.cold_functions_length_;
  }
});

// Returns a cold function for getting a string from a defined length of bytes, starting above 3, it is linked to the length at 1 equals 1
Object.defineProperty(UTFzap.prototype, 'use_cold_function', {
  get: function get() {
    return function (index, buf, length, offset) {
      index = index | 0;
      length = length | 0;
      offset = offset | 0;
      return this.cold_functions_[index | 0](buf, length | 0, offset | 0);
    };
  }
});

// Get the current reusable memory size of the instance
Object.defineProperty(UTFzap.prototype, 'memory_item_length', {
  get: function get() {
    return this.reusable_memory_.length | 0;
  }
});

// Set the current reusable memory size a new length
Object.defineProperty(UTFzap.prototype, 'set_memory_item_size', {
  get: function get() {
    return function (length) {
      length = length | 0;
      this.reusable_memory_ = new Uint16Array(length | 0);
    };
  }
});

// Write a number that should be from 0-65535 in memory
Object.defineProperty(UTFzap.prototype, 'set_memory_item', {
  get: function get() {
    return function (index, value) {
      index = index | 0;
      value = value | 0;
      this.reusable_memory_[index | 0] = value | 0;
    };
  }
});

// Write an array of numbers that should be from 0-65535 in memory
Object.defineProperty(UTFzap.prototype, 'set_memory_items', {
  get: function get() {
    return function (index, value) {
      index = index | 0;
      this.reusable_memory_.set(value, index | 0);
      return value.length | 0;
    };
  }
});

// Read a number that should is from 0-65535 in memory
Object.defineProperty(UTFzap.prototype, 'get_memory_item', {
  get: function get() {
    return function (index) {
      index = index | 0;
      return this.reusable_memory_[index | 0] | 0;
    };
  }
});

// Pack a string onto a buffer (TypedArray on 8bits) passed in arguments
// Return the length of the array it has used
UTFzap.prototype.pack = function (str, length, buf, offset) {
  length = length | 0;
  offset = offset | 0;
  var start = offset | 0,
    currHigh = 0,
    code = 0,
    high = 0,
    low = 0,
    i = 0;
  for (; (i | 0) < (length | 0); i = (i + 1 | 0) >>> 0) {
    code = (str.charCodeAt(i) | 0) >>> 0;
    high = code >> 8;
    if ((high | 0) != (currHigh | 0)) {
      buf[i + offset++] = 0;
      buf[i + offset++] = (high | 0) >>> 0;
      currHigh = (high | 0) >>> 0;
    }
    low = (code | 0) >>> 0 & 0xff;
    buf[i + offset | 0] = (low | 0) >>> 0;
    if ((low | 0) == 0) {
      buf[i + ++offset] = (currHigh | 0) >>> 0;
    }
  }
  return (length + offset - start | 0) >>> 0;
};

// Unpack a typedarray to a new string, offset and length are required
// It is to force the library implementation to use a few buffer and write on shared "slice"
// It prevents it from creating/destroying too much space in memory and avoid availability usage from the JS garbage collector
UTFzap.prototype.unpack = function (buf, length, offset) {
  // Coerce numbers to entire integer
  length = length | 0;
  offset = offset | 0;

  // Init temporary variable onc in the beginning of the function
  var end = offset + length | 0,
    currHighCode = 0,
    currHigh = 0,
    codes_index = 0,
    curr = 0,
    next = 0,
    i = 0,
    next_zero_code = 0,
    next_same_high_code = 0,
    next_serie_change_something = 0;

  // Those functions perform a bit better we gain 10% speed
  function get_buf_i(buf, i) {
    return (buf[i | 0] | 0) >>> 0;
  }
  function plus_uint_one(a) {
    return (a + 1 | 0) >>> 0;
  }
  function plus_uint_two(a) {
    return (a + 2 | 0) >>> 0;
  }
  function plus_uint_three(a) {
    return (a + 3 | 0) >>> 0;
  }
  function plus_uint(a, b) {
    return (a + b | 0) >>> 0;
  }
  function uint_less(a, b) {
    return (a | 0) >>> 0 < (b | 0) >>> 0;
  }
  function uint_not_zero(n) {
    return (n | 0) >>> 0 != 0;
  }
  function uint_equal(a, b) {
    return (a | 0) >>> 0 == (b | 0) >>> 0;
  }

  // short string cases
  if ((length | 0) < 3) {
    switch (length | 0) {
      case 2:
        var a = buf[offset++] | 0;
        if ((a | 0) == 0) {
          return "\0";
        }
        return this.fcc(a | 0, buf[offset | 0] | 0);
      case 1:
        return this.fcc(buf[offset | 0]);
      case 0:
        return "";
    }
  } else if ((length | 0) < (this.cold_functions_length_ - 1 | 0)) {
    // Cold function that gets optimized since they are a bit more easily understood by the compiler
    // We have created those function earlier...
    return this.use_cold_function(length | 0, buf, length | 0, offset | 0);
  }

  // Increase temporary reusable memory if necessary
  if ((end - offset | 0) > (this.memory_item_length | 0)) {
    this.set_memory_item_size((end - offset) * 1.5 | 0);
  }
  for (i = offset | 0; uint_less(i | 0, end | 0);) {
    curr = get_buf_i(buf, i | 0);
    next = get_buf_i(buf, plus_uint_one(i | 0));

    // This operation can be simplified in writings but here we can mostly batch read/write by two ops
    if (uint_not_zero(curr | 0)) {
      if (uint_not_zero(next | 0)) {
        this.set_memory_item(codes_index | 0, plus_uint(curr | 0, currHigh | 0));
        this.set_memory_item(plus_uint_one(codes_index | 0), plus_uint(next | 0, currHigh | 0));
        codes_index = plus_uint_two(codes_index | 0);
        i = plus_uint_two(i | 0);
      } else {
        if (uint_equal(get_buf_i(buf, plus_uint_two(i | 0)), currHighCode | 0)) {
          this.set_memory_item(codes_index | 0, plus_uint(curr | 0, currHigh | 0));
          this.set_memory_item(plus_uint_one(codes_index | 0), plus_uint(next | 0, currHigh | 0));
          codes_index = plus_uint_two(codes_index | 0);
          i = plus_uint_three(i | 0);
        } else {
          this.set_memory_item(codes_index | 0, plus_uint(curr | 0, currHigh | 0));
          currHighCode = get_buf_i(buf, plus_uint_two(i | 0));
          currHigh = get_buf_i(buf, plus_uint_two(i | 0)) << 8;
          codes_index = plus_uint_one(codes_index | 0);
          i = plus_uint_three(i | 0);
        }
      }
    } else {
      if (uint_equal(next | 0, currHighCode | 0)) {
        this.set_memory_item(codes_index | 0, plus_uint(curr | 0, currHigh | 0));
        codes_index = plus_uint_one(codes_index | 0);
        i = plus_uint_two(i | 0);
      } else {
        currHighCode = next | 0;
        currHigh = next << 8;
        i = plus_uint_two(i | 0);
      }
    }
  }
  return this.string_from_memory(0, codes_index - 1 | 0);
};

// Simple function to encode a string to a new buffer (Typed Array on 8bts)
// it has to allocate a new space inside random access memory managed by the garbage collector of JS
UTFzap.prototype.encode = function($str) {
    var $b = new Uint8Array($str.length*3+2);
    var $l = this.pack($str, $str.length, $b, 2);
    $b[0] = ($l >> 0) & 0xff;
    $b[1] = ($l >> 8) & 0xff;
    return $b.slice(0, $l+2);
};
// Alias
UTFzap.prototype.toUint8Array = UTFzap.prototype.encode;

// Simple function to encode a TypedArray/Buffer to a new string (yes it encodes a string from a Uint8Array)
// it has to allocate a new space inside random access memory managed by the garbage collector of JS
UTFzap.prototype.decode = function($b) {
    var $l = 0 | $b[0] << 0 | $b[1] << 8;
    return this.unpack($b, $l + 2, 2);
}
// Alias
UTFzap.prototype.fromUint8Array = UTFzap.prototype.decode;

// Once exported to the engine, it beguns generating cold functions when user is inactive or consume a few
// Of all available computation power, it cache lazily those cold functions for any new instance created later in the JS VM
UTFzap.lazyComputeColdFunctions();

// Optional exportation for node js
if(typeof module !== "undefined") {
    module.exports = UTFzap;
}else {
    // Global exportation for browser
    window.UTFzap = UTFzap;
}
