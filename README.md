# UTFzap, Intelligent UTF-16 almost 48% faster and 9% lighter compared to the native UTF-8 browser serializer!
![MIT](https://img.shields.io/badge/license-MIT-green)
![Branding of UTFzap](https://raw.githubusercontent.com/pixa-pics/UTFzap/main/Branding.png) ![npm](https://img.shields.io/npm/dw/utf-zap?label=NPM%20DOWNLOAD&logo=NPM)

DEMO : [Go to codepen.io](https://codepen.io/vipertechofficial/pen/LYByVRj)

This library is incredibely fast because we generate a bunch of ~61 functions to encode small string (3-64 chars, up to 255) but it can be parameterized, they are cold function in the sense that the browser can optimize them easily as they are quite static, also we have a working cache of those function, shared and accross all new instance that needs a higher number that the one in cache, that is increased automatically, and which can be reset manually the reusable memory that serves as a temporary working object for each instance, it savs up memory allocation and usage, more than that, everything wihin this module is made to force the JIT compiler to work with entire number like the asm.js project does and obviously you can pass a buffer from elsewhere it can writte onto it without copies, which it will work with in order to again, not create memory allocation for nothing!

```diff 
+ npm install utf-zap // And you get that piece of text-technology
```
> Download it from NPM easily, use /raw or /browser to get other kind of JS bundles once it has been installed inside your project

**#1 Lightweight** (5.5 kB), it only use a 1 Byte Typed Array and some String class functions. It is a compression algorithm that works **fast**, we can **#2 encode and decode at 148% the speed** of the universal UTF-8 `TextEncoder/TextDecoder` tool which by the way doesn't support officialy (not at all) encoding/decoding UTF-16, this native implementation rather provides UTF-8 useful and that's it! Here we also made that it is not only +48% faster but also we **#3 reduce the BytesArray by 9%** which can be summed up with the gain of speed to gives an appropriate view of the given advantages...

Let's use the online demo on [CodePen](https://codepen.io/vipertechofficial/pen/LYByVRj), you can see that it works perfectly like the native browser utility except it has a different byte encoding, here we unfortunately doesn't saves memory usage, but it might be a revenge to come soon.

**You can use or try with this peom:**

<span dir="rtl" class="rtl"><h3>
کوهستان اندامت شعر غریبی‌ست</h3><div>
با تو در آمیزم</div><div>از زیر گرده‌ات تهمینه بزنم بیرون</div><div>نه در این دشت محزون</div><div>درست وسط کوهستان پیکرت</div><div>لای هیبت سنگ‌ها و گرگ‌های پنهان دهان</div><div>&nbsp;</div><div>با تو در آمیزم</div><div>رخساره چو آتش گلگون کنم</div><div>نه در این میانه‌ی مسکوت</div><div>لای پریشانی ابرها</div><div>لای شکل‌های غریب خاطرت</div><div>لای اشتیاق خودم به این همه تلون تو</div><div>&nbsp;</div><div>با تو در آمیزم</div><div>شور شوم سور شوم مست و پر از نور شوم</div><div>نه در آستانه‌ی دری گشوده</div><div>لای دریچه‌ای تنگ</div><div>لای ازدحام تو در پهلوی من</div><div>لای دشنام هیبتت</div><div>لای آن کورسوی مانده در بازوانت</div><div>با تو در آمیزم</div><div>افسانه شوم</div><div>من مست و تو دیوانه</div><div>بایستم</div><div>جیغ‌کشان</div><div>فریاد زنان</div><div>ما را که برد خانه، بریزد از دامنم</div><div>سرخ، سپید، سیاه و کمی هم بنفش</div><div>تقدیر من باشد</div><div>با تو که در آمیزم</div>
</span>

*Translation: [The mountain of your body is a strange poem](https://github.com/pixa-pics/UTFzap/blob/main/poems/MountainOfYourBodyEnglish.md)*

You'll notice that the bytes aren't the same!

---

## Technical details

To sum up, we reuse memory object, we generate cold functions for small strings, and we force the compiler to use entire integer for processing speed! Very smart and that a lot due to pouya-eghbali idea that this module exists, so thanks to himself.


```                                                                                                            
UUUUUUUU     UUUUUUUUTTTTTTTTTTTTTTTTTTTTTTTFFFFFFFFFFFFFFFFFFFFFF                                                      
U::::::U     U::::::UT:::::::::::::::::::::TF::::::::::::::::::::F                                                      
U::::::U     U::::::UT:::::::::::::::::::::TF::::::::::::::::::::F                                                      
UU:::::U     U:::::UUT:::::TT:::::::TT:::::TFF::::::FFFFFFFFF::::F                                                      
 U:::::U     U:::::U TTTTTT  T:::::T  TTTTTT  F:::::F       FFFFFFzzzzzzzzzzzzzzzzz  aaaaaaaaaaaaa  ppppp   ppppppppp   
 U:::::D     D:::::U         T:::::T          F:::::F             z:::::::::::::::z  a::::::::::::a p::::ppp:::::::::p  
 U:::::D     D:::::U         T:::::T          F::::::FFFFFFFFFF   z::::::::::::::z   aaaaaaaaa:::::ap:::::::::::::::::p 
 U:::::D     D:::::U         T:::::T          F:::::::::::::::F   zzzzzzzz::::::z             a::::app::::::ppppp::::::p
 U:::::D     D:::::U         T:::::T          F:::::::::::::::F         z::::::z       aaaaaaa:::::a p:::::p     p:::::p
 U:::::D     D:::::U         T:::::T          F::::::FFFFFFFFFF        z::::::z      aa::::::::::::a p:::::p     p:::::p
 U:::::D     D:::::U         T:::::T          F:::::F                 z::::::z      a::::aaaa::::::a p:::::p     p:::::p
 U::::::U   U::::::U         T:::::T          F:::::F                z::::::z      a::::a    a:::::a p:::::p    p::::::p
 U:::::::UUU:::::::U       TT:::::::TT      FF:::::::FF             z::::::zzzzzzzza::::a    a:::::a p:::::ppppp:::::::p
  UU:::::::::::::UU        T:::::::::T      F::::::::FF            z::::::::::::::za:::::aaaa::::::a p::::::::::::::::p 
    UU:::::::::UU          T:::::::::T      F::::::::FF           z:::::::::::::::z a::::::::::aa:::ap::::::::::::::pp  
      UUUUUUUUU            TTTTTTTTTTT      FFFFFFFFFFF           zzzzzzzzzzzzzzzzz  aaaaaaaaaa  aaaap::::::pppppppp    
                                                                                                     p:::::p            
                                                                                                     p:::::p            
                                                                                                    p:::::::p           
                                                                                                    p:::::::p           
                                                                                                    p:::::::p           
                                                                                                    ppppppppp           

```

 * Initialization/Loading takes up to ~200ms, but is done once and at idle time, never twice the same function, it automatically update the class for all newer instance that JavaScript will have to create, Idle time means time of fewer computation usage, it uses `RequestIdleCallback`
 * It allocate an unsigned integer typed array of 256*8 bits by default but again you can set it higher or lower along with reseting it simply.
 * This reusable memory has a fixed length yet it adjust itselfs to higher bounces automatically with steps of 1.5x the need if lower to not have too much new allocation going on.
 * It generate for string length 3-64, funny "cold functions" from string that get into a constructor for creating Functions that gets optimized by the browser automatically as they behave predictably with much more certainety than more difficult functions to understand at the Just-In-Time process of compiling the JS source code when someone loads the page.
 * Code is written in ASM.JS style so number are fixed to be stored based on entire number encoding, always, and number comparaison too, so we give more strict instructions for the browser to have less hesitations.
 * It only weights as low asa bit more than 5Kb, and only uses the `Uint8Array` class as something special, there is no dependency except in the browserified version which weights 30 kB in average, which can be usefull for retrocompatibility.
 * You can saves up to half the size of byte length compared to the true UTF-16le or UTF16be encoding and as much as a speed of 175% the `TextEncoder` object instance, simply insane!

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

---

## How does it works? 

Is this like a text-unicorne for unicode, that means something totally mythological as opposd to coputer science? UTFzap is a small compression library it produce text as lightweight as utf-8 yet it works much faster, it simply describe the "level" encoded on every impared bytes that regards a set of chaacters on the beginning of the serie using 0x00 as an identifier for changing the current "level" description... something more precise is shown below. 

---


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

With UTFzap, the first word becomes:

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

To escape a low byte that equals `00`, UTFzap adds the current high byte after
the low byte in the sequence.

Check the source code for more info.

---

Forked from UTFZ-lib

