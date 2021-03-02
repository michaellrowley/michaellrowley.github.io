# Detecting sandboxes

### ***The indefinitive solution.***



## What are sandboxes?

Sandboxes are a (conceptually) secure way to execute software without exposing the computer's information to the program - most antiviruses ([Kaspersky](https://www.kaspersky.com/enterprise-security/malware-sandbox), [Bitdefender](https://www.bitdefender.com/business/enterprise-products/sandbox-analyzer.html), and even [Windows's default antivirus](https://docs.microsoft.com/en-us/windows/security/threat-protection/windows-sandbox/windows-sandbox-overview)) are delivered pre-equipped with a sandboxing feature, not to mention that almost every heuristic analysis tool will execute programs in some form of their own sandbox (this includes [any.run](https://any.run), [anlyz.io](https://anlyz.io), [hybrid-analysis](https://www.hybrid-analysis.com/), and [cuckoo sandbox](https://cuckoosandbox.org/)) - this means that malicious programs (in theory) are unable to access any files, and any attempt to do so can be logged and identified by the analysis team/software.

This doesn't always work out the way that antivirus companies expect if a piece of malware can identify itself as being executed under a sandbox, this is because the malware can disable the malicious components while being monitored in a controlled environment, and once the program has been 'cleared' for execution on the host machine; the malware can proceed to wreak havoc on the system. Sandbox evasion occurs frequently in the wild and has been researched & documented by most malware research teams - an intriguing analysis includes McAfee's study: ["Evolution of Malware Sandbox Evasion Tactics - A Retroactive Study"](https://www.mcafee.com/blogs/other-blogs/mcafee-labs/evolution-of-malware-sandbox-evasion-tactics-a-retrospective-study/#:~:text=Malware evasion techniques are widely,well as analysis and understanding.&text=Many companies use these kinds,block other related malicious activity.) which almost read as a 'Sandbox evasion 101' guide as the study takes an in-depth look at historical sandbox evasion techniques used by malware, and even provides reverse-engineered/rewritten examples of many scenarios.

## How does malware *usually* identify a sandbox?

Looking at [The McAfee study]([Evolution of Malware Sandbox Evasion Tactics – A Retrospective Study | McAfee Blogs](https://www.mcafee.com/blogs/other-blogs/mcafee-labs/evolution-of-malware-sandbox-evasion-tactics-a-retrospective-study/#:~:text=Malware evasion techniques are widely,well as analysis and understanding.&text=Many companies use these kinds,block other related malicious activity.)) and [VMRay's study]([Introduction to Sandbox Evasion Techniques | VMRay](https://www.vmray.com/cyber-security-blog/sandbox-evasion-techniques-part-1/)) - it seems that most antivirus providers have a pretty profound knowledge of how malware identifies a sandbox, and how they can protect their service from such identification methods.

In this post I'll be using Sandboxie as my test subject, this is primarily because it is simple to use, free, and open source. I've used Sandboxie multiple times before but had never really questioned its effectiveness, but with the advent of [Sandboxie+]([sandboxie-plus/Sandboxie: Sandboxie - Open Source (github.com)](https://github.com/sandboxie-plus/sandboxie)) (an updated Qt-Based GUI and some new features) I wondered if malware is aware that it is running under a sandbox when I drag files into the ominous Windows 7 reminiscent window.

So I downloaded the new ``Sandboxie+`` portable application, opened [Visual Studio]([Visual Studio IDE, Code Editor, Azure DevOps, & App Center - Visual Studio (microsoft.com)](https://visualstudio.microsoft.com/)), and started testing.

### Background processes:

I wanted to check how background processes were handled by the Sandboxie+ Sandbox so I wrote this to help me identify anything unusual:

```C++
HANDLE ProcessListSnapshot = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0);
BOOL IterationSuccess;
PROCESSENTRY32 IterativeProcess;
IterativeProcess.dwSize = sizeof(PROCESSENTRY32);
for (IterationSuccess = Process32First(ProcessListSnapshot, &IterativeProcess);
	IterationSuccess;
	IterationSuccess = Process32Next(ProcessListSnapshot, &IterativeProcess)) {
	wprintf(L"EXE: %s\n", IterativeProcess.szExeFile);
}
system("PAUSE");
```

Running this on my PC resulted in a list of ``*.exe`` representing my open processes (or at-least the open processes that ``CreateToolHelp32Snapshot`` was willing to divulge) - running this in Sandboxie+ also resulted in a full list of my open processes which I didn't really expect, this indicated that the process-lists returned by the sandbox was consistent with my actual processes.

To help narrow down any discrepancies between the two process lists, I figured it'd be a good idea to synchronize the lists and have them start at the same time (spoiler: this didn't work), despite having them synchronized to a hundred-tick resolution, the process lists didn't show any discrepancies that could be used to identify if the current process was being executed in a sandbox (note that there were some interesting results that could narrow down if a sandbox was being run, for example - I noticed that ``SbieSvc.exe`` was operating with four threads and within four processes of being at the end of the process list if there was a process being run in a sandbox).

After realizing the hunt for a standout process wasn't going to lead me anywhere, I progressed to testing ``OpenProcess``.

### OpenProcess:

``OpenProcess(n)`` is used to open a handle to a process, it demands appropriate privileges, the process's PID, and your desired access.

Using the only interesting thing that I had noticed during the last topic (the ``SbieSvc.exe`` process), I filtered out all other processes and focused on that one, I then attempted to call ``OpenProcess`` to open a handle to every instance of ``SbieSvc.exe`` encountered and logged the results - these were the results (``[ x ]`` means unsuccessful, whereas ``[ - ]`` signifies a successful handle being opened/emulated):

Executing from windows with Sandboxie+ in the background (not sanboxed):

```c++
[ x ] PID: 10188 - OP: 0
[ x ] PID: 3672 - OP: 0
```

Executing from Sandboxie+:

```c++
[ x ] PID: 10188 - OP: 0
[ x ] PID: 3672 - OP: 0
[ - ] PID: 13892 - OP: 608 // Handle opened successfuly
```

As you've probably noticed, the third handle (``PID: 13892``) was only able to be opened from within the sandbox which was exciting, so I ran the test a few more times and was depressed to find out that, similarly to the background processes stage, the third process was able to have a handle opened whenever there was a process running in the sandbox, it didn't necessarily mean that it was our process executing in the sandbox.

I then took things a step further and called ``TerminateProcess`` on the last process, I then did this from within and outside of the sandbox (similarly to before) and logged the responses (``Terminated`` means that ``TerminateProcess(n)`` returned TRUE, whereas ``Invincible`` means that ``TerminateProcess(n)`` returned ``FALSE` and was unable to kill the process):

Executing inside Sandboxie+:

```c++
[ x ] PID: 10188 - OP: 0
[ x ] PID: 3672 - OP: 0
[ - ] PID: 156 - OP: 240 => Invincible
```

Executing outside Sandboxie+ (not elevated):

```c++
[ x ] PID: 10188 - OP: 0
[ x ] PID: 3672 - OP: 0
[ - ] PID: 156 - OP: 240 => Terminated
```

These results seem to show that it is only possible for ``TerminateProcess(SbieSvc.exe)`` to return true if the calling application is *outside* of the sandbox.

To create a PoC for this, I needed to figure out the *exact* conditions for the sandbox check to return true, so here they are:

<img src="https://i.ibb.co/BLLkF8m/image.png" alt="The PoC methodology flowchart." style="zoom:50%;"/>

A semi-reliable way to confirm that you are in a sandbox after following the final 'no' flow-path is to check ``GetLastError()`` when you can't call ``TerminateProcess`` - if you ever get [MSDN](https://docs.microsoft.com/en-us/windows/win32/debug/system-error-codes--0-499-) ``ERROR_ACCESS_DENIED (0x05)`` then you can be pretty sure that you are running in a sandbox environment, this is what I've used in [my initial PoC on Github](https://github.com/michaellrowley/Sandboxie-detection).

It is always worth understanding why something is possible even if you've discovered it by chance (like the ``TerminateProcess`` detection method) - we know that the method works by attempting to terminate each ``SbieSvc.exe`` process available and comparing their error code to ``ERROR_ACCESS_DENIED`` - only one of the ``SbieSvc.exe`` processes actually returns ``0x05`` when a sandboxed program attempts to terminate it, the other two simply disallow the processes to open handles to them, this is because they operate under ``NT AUTHORITY\SYSTEM`` and our program executes under the client's username, as a result of this, we can't open a handle to them. (Sidenote: One of the two processes is always running, the other starts when a program is placed into the sandbox but from then on, is also always running, the third (that we use to detect the sandbox) runs for a brief window while the sandbox instance is being created.)

The third process, however, executes in the same space as the client, meaning that opening a handle is possible, and the service must deny access when the sandboxed application calls ``TerminateProcess`` to avoid closing - making the detection possible due to its distinct ``ERROR_ACCESS_DENIED`` ``GetLastError()`` code.

### Sidenote: Loaded DLLs

The DLLs loaded into a process are usually a good giveaway of the programs using it (that is unless the DLLs are loaded through other, harder to detect, methods such as common manual-mapping) - a [StackExchange post](https://security.stackexchange.com/questions/215502/program-detecting-sandboxie-present-how-to-prevent) showed a user complaining about a game detecting itself being run in a sandboxed mode, he/she said that the game detected ``the presence of "SbieDll.dll" in the module list of the game[']s process.`` - I figured that the ``SbieDll.dll`` check sounded too easy to be true and, if Sandboxie+ loaded any DLLs, they'd be randomly named or at-least loaded in a way that wouldn't show them in module listings (again, Manual-mapping) - so I wrote a simple program that should operate without too many flaws in a sandbox environment (if you're wondering, it says 'beep', waits five hundred milliseconds, and then says 'boop'), loaded it into Sandboxie+, launched ProcessHacker 2, and checked the openly loaded modules; to my surprise, there is was - ``SbieDll.dll`` was sat in the ``Properties->Modules`` tab of the loaded process.

While this seemed like a huge oversight, I assumed that it was due to Sandboxie+ not really caring about being detected.

This writeup's purpose is to cover a new way to detect sandboxes that I haven't seen in the wild before, this is by no means an exhaustive list (or even a list at all) and should not be treated as such, using ``CreateFile`` to create and track files' existence is another common way to detect sandboxes, with the most popular (from my analysis) being for a program to check its loaded DLLs for a sandbox signature or DLL-name. Different sandboxes have different detection vectors and each (most) require analysis.
