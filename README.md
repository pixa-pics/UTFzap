# UTFzap --> UTF-16 from -9% up to half weight and about the same-175% faster than ut8!

![Branding of UTFzap](https://raw.githubusercontent.com/pixa-pics/UTFzap/main/Branding.png)

DEMO : https://codepen.io/vipertechofficial/pen/LYByVRj

It is incredibely fast because we generate a bunch of 96 functions to encode small string (0-60 chars) so they are cold function that the browser can optimize easily, also we have a working cache that is increased automatically and which can be reset manually at function call so it savs up memory allocation  usage, more than that, everything is "kind-typed" so we can force the compiler to work with entire number like asm.js does (which is a bridge to compile C/C++ onto JS with speed in mind.and obviously you can pass an object onto which it will work with in order to again, not create memory allocation for nothing!

> Lightweight (3.4+kb, and **1.4kb gzipped**) compression algorithm that works *fast*!

You can use this peom:

> Աեցեհի իմ լավ ?ւղիե լավարար,
> Կյաեբս չտայի կասկածի մհգիե...
> Այեպհս կ?ւզհի մհկե իեծ ?ավատր,
> Այեպհս կ?ւզհի ?ավատալ մհկիե։

## Technical details

 * Initialization takes ~100ms, but once the library is laoded inside the browsers, it will innitialize only once and once for all delaying this action at available computation power later or at now if the instance is created immeiatly at importation, if you set cold functions to be higher than 128 which isn't recommanded, you'll have to wait a little longer, itdoens't cache that far cold functions
 at you might need to anticipate it
 * It allocate an unsigned integer typed array of 256*8 bits by default
 * You can reset memory length but it adjust to higher bounces automatically
 * It generate for string length 0-60, "cold functions" from string that gets optimized by the browser automatically as they behave predictably
 * Code is written in ASM.JS style so number are typed to entire number and number comparaison too
 * It only weights as low asa bit more than  3.4Kb, and only uses `Uint8Array` class as something special
 * You can saves up to half the size of byte length and encode/decode as much as a speed of 175% the `TextEncoder` object instance
 
 So to sum up, we reuse memory object, we generate cold functions for small strings, and we force the compiler to use entire integer for processing speed! Very smart and that a lot due to pouya-eghbali, so thanks to him.

## How to use it?

```JavaScript


import UTFzap from "utf-zap"; // In node.js
/* OR */
var UTFzap = window.UTFzap; // Use the minified version for browser (> safari 10 & > Chrome 51)
var utfzap = new UTFzap(); // memory_size (default: 256*8), cold_function (default: 66)

var string = "Hello my friend, welcome to city utfzap, سلام"
var buffer = new Uint8Array(88);
var offset = 0;
var lengthIn = string.length;

var lengthOut = utfzap.pack(string, lengthIn, buffer, offset) // Write to a buffer
var decoded = utfzap.unpack(buffer, lengthOut, offset); // Read from a buffer

console.log(buffer, decoded);
console.log(utfzap.encode(string), utfzap.decode(utfzap.encode(string))); // Do the same but has to recreate a memory object each time
// OUTPUT : 45, 0, 108, 108, 111, 32, 109, 121, 32, 102, 114, 105, 101, 110, 100, 44, 32, 119, 101, 108, 99, 111, 109, 101, 32, 116, 111, 32, 99, 105, 116, 121, 32, 117, 116, 102, 122, 97, 112, 44, 32, 0, 6, 51, 68, 39, 69

// ALSO to reset the memory object
utfzap.reset() // memory_size (default: 256*8)
```


UTFzap is a small utf16 compression library it produce text as lightweight as utf-8 but works much faster.

## How does it work?

Consider the following utf16 representation of "Hello":

```hex
48 00 65 00 6c 00 6c 00 6f 00
```

You can see that all the odd bytes are `00`.

Consider the following utf16 representation of the Farsi word "سلام":

```hex
33 06 44 06 27 06 45 06
```

You can see that all the odd bytes are `06` and this pattern repeats itself.
These are wasted bytes. The letters of each language, are incrementally one
after another and share the same high byte most of the time. Utfz assumes
the high byte is equal to `00` and changes it every time it encounters a `00`.

With utfzap, the first word becomes:

```
48 65 6c 6c 6f
```

and the second one becomes:

```
00 06 33 44 27 45
```

Where the first `00` tells the decoder to set the high byte to `06`. Words of
different languages with different high bytes can be combined:

```
48 65 6c 6c 6f 00 06 33 44 27 45
```

To escape a low byte that equals `00`, utfzap adds the current high byte after
the low byte in the sequence.

Check the source code for more info.

---

Forked from UTFZ-lib

