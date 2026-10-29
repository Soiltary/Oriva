# Installation

[العربية](installation.ar.md) · [Current acceptance](release-acceptance.md)

Windows10/11 x64 is the intended target. Actual final-executable GUI, installation, update and relaunch acceptance ran in an isolated Windows11 guest. No bundled browser engine, Python or .NET is required. Cloud operations require Internet. The executable is unsigned; checksums verify bytes rather than independent publisher identity. Do not bypass OS security warnings. Physical High-DPI and the full physical-device matrix remain unverified; normal library use requires at least850×720 work-area pixels at the tested scaling.

Install only after the official package is published on the repository's releases page. Verify ZIP SHA-256, extract all files, verify FILE-SHA256SUMS.txt, then run Setup.cmd in your own Windows profile. It adds shortcuts and Explorer integration without administrator elevation. Acceptance work preserved the owner's installed application and host registry; all actual installer/update mutations were inside a disposable guest.

Create an account on the website and save its one-time recovery code privately, then sign in on each device. No email-verification or emailed reset service is configured; password recovery requires the account recovery code. Never include real credentials or codes in reports. The compatible production API is deployed.

Explorer Save to Oriva shows a naming/confirmation screen. On Windows11 the classic entry may be under Show more options. The original local filename is preserved. The tray supports hide/reopen and explicit Exit Oriva. Remove-context-menu.cmd removes Explorer integration only; it is not a full uninstaller and does not delete cloud data. Native editing is plain text/Markdown, with visual preview on the website and no persistent offline document editing.

The official package is now published. Product1.0.0 uses monotonic update ordering2.0.0 and anonymous GitHub Stable discovery with restricted HTTPS redirects, exact size and SHA-256. Old internal clients bootstrap manually from the verified ZIP. See [GitHub updates](github-updates.md) and [version transition](update-transition.md).
