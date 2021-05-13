# Windows function hooking

*Note: I'll be using the word hook/hooking and detour/detouring interchangeably, that is because they refer to the same concept*

Simply put, function hooking or detouring is the process of modifying a file or process in order to intercept function calls, the use of this technique generally ranges from monitoring/logging arguments passed to functions, to replacing the return values altogether - function hooking is commonly used in an extremely wide variety of industries, a few of which can be seen below:

- Video game cheats/anti-cheats. [PoC regarding Valve's Anti-Cheat](https://github.com/danielkrupinski/vac-hooks/)
- Abstract error handling.
- Anti-virus sandboxes. [(This is a good read)](https://blog.checkpoint.com/wp-content/uploads/2016/10/DefeatingSandBoxEvasion-VB2016_CheckPoint.pdf)
- [Key-logging](https://en.wikipedia.org/wiki/Keystroke_logging) and malware as a whole.

Each of the above uses for hooking functions has a different meaning and arguably contrasting intentions (speed, stealth/detection, etc) - as a result of this, the hooking methods used to detour functions varies between software.

### How does hooking work?

Simply, your process re-routes all calls from function ``void Target( ) { }`` to ``void hkTarget( ) { }`` although, as I'm sure you've noticed, this simple interpretation of hooking/detouring isn't going to provide anyone with enough knowledge to utilize it, but to be more specific about how hooking works, I'd need to know exactly which hooking method you were attempting to use so that I could provide you with exact details rather than a broad, relatively accurate overview that would apply to all hooking/detouring methods. More accurately - I'll be covering trampoline hooking throughout this writeup due to its applicability to the topic, simplicity, and popularity.

#### Trampoline hooking

Trampoline hooking simply places a ``JMP [0xE9]`` call at the start of the given function alongside the address of the callback function, for example - if the target function (that you wanted to hook) was located at ``0x28EC91FF`` and your callback function (where you want calls to the target function to be redirected to) was located at ``0x38EC91FF`` (exactly ``0x10000000`` bytes ahead of the target function) - you'd write ``JMP 0x10000000`` to the start of your target function if your ``JMP`` instruction was relative*.

That's not all, unfortunately, you've had to overwrite some bytes to make that ``JMP 0xABCD1234`` call, and without those instructions, your target function, when returned to, might crash the process - to handle this, we need to calculate how many bytes we have overwritten, and then process those bytes within *our* function so that they aren't neglected and left to cause a crash. So firstly, we must calculate how many bytes we have overwritten; luckily, with all ``JMP [ADDRESS]`` the answer should be constant - five bytes, this is due to the ``0xE9 [JMP]`` byte, and then four other bytes for the callback-function offset pointer (``intptr_t``, for example is 32 bits -> 4 bytes), so 4 + 1 = 5 bytes have been overwritten, this means that before writing our hook's bytes, we first must extract those bytes and add them to our own function for the previously mentioned reasons - after that, the hook is prepared to be executed!

##### Scenario!

```assembly
FUN_EXAMPLE:
	8b ff 55 8b ec
	83 3d 94 1c 47; this is the MessageBoxA function of User32.dll.
	76 00 74 22 64
```

The above function is the start of ``MessageBoxA``, I can honestly say I don't know what it does because I can't read ~~parsel-tongue~~ assembly, needless to say, however, that if I removed those bytes - the function probably wouldn't do too well.

I'd like to use trampoline hooking to detour all calls to ``FUN_EXAMPLE`` to ``FUN_CALLBACK`` for no reason other than to jump right back to ``FUN_EXAMPLE``.

Firstly, our code should save the first five bytes of ``FUN_EXAMPLE`` - this is because we will be overwriting these bytes with our ``JMP [0x000000]`` byte patch - the first five bytes are ``8b ff 55 8b ec``, these should be saved for later.

After this, our code should create the hook callback, write the bytes required, and then store the function's address for later use in calculating the offset pointer.

Next, our code should calculate the distance between ``FUN_EXAMPLE`` and ``FUN_CALLBACK`` and store the value as a 32 bit variable (so that it only takes four bytes totaling to the 5 bytes we stored).

Finally, our code should write the hook ``JMP`` in ``FUN_EXAMPLE`` and the backed-up five bytes in ``FUN_CALLBACK``:

```assembly
FUN_EXAMPLE:
	E9 PTR_OFFSET
	83 3d 94 1c 47
	76 00 74 22 64
```

```assembly
FUN_CALLBACK:
	8b ff 55 8b ec; Call original five bytes.
	JMP FUN_EXAMPLE; Return execution without messing anything up too badly.
```

As a result of this, all calls to ``FUN_EXAMPLE`` will be routed through ``FUN_CALLBACK`` first.

The main downside to trampoline hooking is that modifying the ``.text`` section of a program is known as "byte patching" and is easily detectable, making it useless for anything stealth-related.

The main upside/reason people use trampoline hooking is its simplicity and availability, there is a lot of documentation about trampoline detours/hooking online and Microsoft even has an open-source library for it.

### How does Windows' detour library work?

The [Microsoft detour library](https://github.com/microsoft/Detours) provides an out-the-box solution for hooking internal functions - this makes detouring much more accessible and simple as developers don't need to write their own hooking solution.

We can analyze the [Microsoft detour library](https://github.com/microsoft/Detours) by examining the before and after functions that have been hooked by the Windows detour library to understand how the Windows detour library actually works (it is open source, but not all projects will be and therefore, I won't be using the source code to help in this analysis).

Firstly, I needed to setup a reasonably easy way to get all of the bytes in a given function, all (to my knowledge) intel x86 functions end in ``0xcc`` bytes, so I used that as a basis for dumping function bytes in this C++ code:

```C++
// Returns all bytes until the next 0xcc from Pointer,
// Also sets *_Length to the distance from Pointer to the next 0xcc byte (end-of-function).
BYTE* DumpBytes(void* Pointer, ULONG* _Length, UCHAR NewlineOffset = 5) {
	BYTE* FnBytes = (BYTE*)Pointer;
	printf("Dumping bytes at 0x%08x.\n", Pointer);
	printf("\n0\t| ");
	for (ULONG Index = 0; FnBytes[Index] != 0xcc; Index++) {
		printf(" %02x", FnBytes[Index]);
		if (Index % NewlineOffset == (NewlineOffset - 1)) {
			printf("\n%d\t| ", Index);
		}
		if (_Length != nullptr) {
			*_Length = Index;
		}
	}
	printf("\n");
	return FnBytes;
}
```

Using this with ``MessageBoxA`` returns the following output:

```assembly
Dumping bytes at 0x7644ee90.

0       |  8b ff 55 8b ec; First five bytes.
4       |  83 3d 94 1c 47
9       |  76 00 74 22 64
14      |  a1 18 00 00 00
19      |  ba 9c 21 47 76
24      |  8b 48 24 33 c0
29      |  f0 0f b1 0a 85
34      |  c0 75 0a c7 05
39      |  00 1d 47 76 01
44      |  00 00 00 6a ff
49      |  6a 00 ff 75 14
54      |  ff 75 10 ff 75
59      |  0c ff 75 08 e8
64      |  3b 02 00 00 5d
69      |  c2 10 00
```

and then, after using Microsoft's detour library with ``MessageBoxA`` and my own function, I got this output:

```assembly
Dumping bytes at 0x7644ee90.

0       |  e9 9c 27 8e 8a ; This line has changed.
4       |  83 3d 94 1c 47
9       |  76 00 74 22 64
14      |  a1 18 00 00 00
19      |  ba 9c 21 47 76
24      |  8b 48 24 33 c0
29      |  f0 0f b1 0a 85
34      |  c0 75 0a c7 05
39      |  00 1d 47 76 01
44      |  00 00 00 6a ff
49      |  6a 00 ff 75 14
54      |  ff 75 10 ff 75
59      |  0c ff 75 08 e8
64      |  3b 02 00 00 5d
69      |  c2 10 00
```

Notice how ``0x7644ee90`` to ``0x7644ee94`` (an inclusive total of 5 bytes) has changed from ``8B FF 55 8B EC`` to ``E9 9C 27 8E 8A`` - this is likely to be the detour instruction as we should be able to recognize that ``E9`` is a ``JMP`` call, and the four bytes after that are the offset that needs to be jumped.

*TL;DR ^ - The Microsoft detour library uses trampoline hooking*.