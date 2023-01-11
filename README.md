# UTFzap --> UTF-16 Lighter and Faster!

![Branding of UTFzap](https://raw.githubusercontent.com/pixa-pics/UTFzap/main/Branding.png)

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


UTFzap is a small utf16 compression library.

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

With utfz, the first word becomes:

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

To escape a low byte that equals `00`, utfz adds the current high byte after
the low byte in the sequence.

Check the source code for more info.

---

Forked from UTFZ-lib
