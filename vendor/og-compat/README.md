# Existing-renderer compatibility adapter

This private dependency adapter supplies Vinext's `@vercel/og` import using the renderer already shipped in pinned Next 16.4.1. Node and Workers keep separate upstream entry points. It does not copy, modify, rename or claim ownership of the renderer; Next's bundled OG/Satori licenses and binary assets remain in the installed Next package.

Next incorporated the official SVG serialization fix in [commit 868fad3](https://github.com/vercel/next.js/commit/868fad3), released in 16.3.6. The standalone `@vercel/og` 1.0.3 package clears the Satori advisory but fails our real Node ImageResponse probe in its bundled HarfBuzz loader. This adapter avoids that broken bundle and preserves image rendering instead of disabling it or masking dependency versions. Run the OG runtime regression and Workers rendering fixture after any Next/Vinext change.
