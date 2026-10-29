# GitHub delivery transition

[العربية](github-updates.ar.md)

The Sites18 archive does not contain the new1.0.0/compatibility2.0.0 executable aliases or v2 feed. Actual new routes return404 while the retained1.5.3 feed returns200. This is missing deployment content, not evidence that Sites forbids executable routing. The published API and website remain unchanged.

The first public Windows release can use the existing `Soiltary/Oriva` repository as its authoritative update source. GitHub documents public release metadata and asset SHA-256 digests, and asset downloads can return200 or302 ([release API](https://docs.github.com/en/rest/releases/releases), [asset API](https://docs.github.com/en/rest/releases/assets)). The implementation uses an independent anonymous WinHTTP connection, not the Oriva authenticated API transport.

The shipped client checks only the latest published Stable release. Exactly one uploaded `windows-update.json` and one uploaded `Oriva.exe` must have sizes, SHA-256 digests and canonical asset API URLs belonging to this repository. The manifest is downloaded and hash-verified before parsing; it binds the product version to the release tag and executable size/digest. Its `schemaVersion` is1 and its explicit `updateVersion` retains monotonic ordering2.0.0 for public1.0.0. Both public-product and internal-order downgrades are rejected.

Downloads permit HTTPS on443 only. Automatic redirects, cookies and automatic authentication are disabled. One inspected302 from the asset API to the exact GitHub release CDN host and repository-ID path is permitted; arbitrary hosts, ports, paths, HTTP and subsequent redirects fail closed. Responses are bounded, exact size and SHA-256 checked, and partial files removed on failure. No Oriva cookie, Origin header, password or provider token is transmitted. Windows certificate verification remains enabled. GitHub API/CDN availability and anonymous rate limits can defer an update; they cannot authorize an unverified install.

The existing installer/updater still verifies staged bytes, preserves the installed previous executable and profile, and restores previous bytes if immediate relaunch fails. This is recovery from a launch failure, not a guarantee to detect a process that starts and later crashes. Unsigned status remains disclosed; hashes and repository HTTPS are the distribution trust boundary, not an independent publisher signature.

Internal1.5.3 and earlier unshipped candidates contain fixed Sites update endpoints. Their executable code cannot be redirected to GitHub without installing a new client or changing their old Sites feed. For this first launch, manually installing the verified GitHub ZIP is the supported bootstrap. It preserves the same per-user profile/DPAPI session and monotonic update ordering; it does not replace the owner's installation automatically. New1.0.0 clients then use GitHub independently of Sites publishing. The website already links to the existing GitHub releases page. A cosmetic direct-version link is optional; changing Sites is not required for new-client update delivery once actual GitHub acceptance passes.

Implementation, synthetic adversarial tests and final real-network/guest acceptance are tracked separately in the current release record. Do not claim real GitHub delivery or Stable publication until they actually pass.
