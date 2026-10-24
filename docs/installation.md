# Installation

Windows 10/11 x64 is the intended native target. No bundled browser engine, Python or .NET runtime is needed. Internet access is needed for cloud operations. The prepared executable is **unsigned**; checksums detect changed bytes but are not independent publisher authentication. Do not bypass Windows security warnings.

Only install a verified official package after it appears on the releases page. Download the ZIP and SHA256SUMS.txt, verify its exact SHA-256, extract the complete package and run its included Setup.cmd in your own Windows profile. The existing installer adds shortcuts and optional Explorer integration without administrator elevation. These instructions describe the preserved installer; the new candidate's installed update/registry flow has not been exercised.

Create an account on the website, save the one-time recovery code privately, then sign in on each device. Sessions are separate per client, while library data belongs to the same account. No email-verification or emailed password-reset service is configured. An existing account's recovery code is required for password recovery. Never put a real password or recovery code in an issue/report.

Do not install or run a private candidate against real accounts. The candidate needs the matching revision-aware API, which is not yet deployed. See [installation](installation.md) and [update compatibility](update-transition.md).

The preserved native application supports Explorer Save to Oriva, a naming/confirmation screen before upload, tray hide/reopen, a single running instance and authenticated streaming downloads. On Windows 11, classic Explorer entries may be under Show more options. The original local file is not renamed. Removing context-menu integration keeps cloud data. Installer/registry/tray end-to-end acceptance for the new candidate remains unverified; no installed application was changed during this work.

Public product version 1.0.0 is separate from updater compatibility version 2.0.0. Old 1.5.3 clients would reject a plain 1.0.0 numeric offer. The transition uses an old-format same-origin compatibility feed/EXE alias and a new v2 feed with separate public/update versions; both must identify the same verified bytes. Existing clients do not follow a GitHub redirect. Size/SHA-256, HTTPS and strict same-origin paths remain required. The original comparator passed transition regressions; actual installed replacement/relaunch has not been exercised. Existing production feeds remain unchanged while release gates are open.
