# Oriva 1.0.0 native Windows source

This is the existing C/Win32 source. The public product version is 1.0.0; updater ordering uses a separate monotonic compatibility version 2.0.0. See ../../docs/update-transition.md. The default build targets the official HTTPS API; compiling does not authorize running a candidate against real accounts. No Stable binary is claimed until release gates pass. The executable is unsigned unless a later signature is explicitly verified.

Windows 10/11 x64 is the target. Build with Zig 0.14.1, keeping output in an isolated workspace folder:

```text
zig rc /fo <workspace>/Oriva.res Oriva.rc
zig cc -target x86_64-windows-gnu -O2 -municode -Wl,--subsystem,windows Oriva.c <workspace>/Oriva.res -o <workspace>/Oriva.exe -lwinhttp -lcrypt32 -lshell32 -lole32 -luuid -lcomdlg32 -lcomctl32 -lgdi32 -luser32 -ladvapi32
```

Quote the `-Wl,--subsystem,windows` argument in PowerShell. Preserve Oriva.ico, the application manifest and VERSIONINFO resource. Do not run Setup.cmd, --install, --remove-menu or --apply-update for local compile verification. Pure console fixtures under tests/ do not call the installer. See ../../docs/installation.md for the eventual verified official package procedure and ../../README.ar.md for full Arabic documentation.

The preserved installer uses the user's profile and Explorer integration. User-scoped DPAPI sessions, fixed HTTPS host, profile paths and native data formats remain unchanged by the version reset. The compatible API is deployed. Actual installation and replacement/relaunch of the exact final executable passed in an isolated Windows guest. Final public-asset delivery and physical High-DPI acceptance remain separate; see ../../docs/release-acceptance.md.

Native RTL resize regression: compile `tests/native-auth-layout.c` with Zig and `-luser32` into the workspace, then run its console EXE. It uses hidden test controls only, not the application profile, network or registry. See ../../docs/qa-followup.md for actual GUI coverage and open acceptance limits.
