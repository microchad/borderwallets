This is the first signed release since 1.0.5 (2022). The downloadable tool has been brought up to date with work that until now lived only in the source tree, and hardened following two independent security reviews.

## Verify before you use it

Every release is PGP-signed. The signature covers the SHA-256 hash file, so check both, then run the file offline.

```
curl https://borderwallets.com/pgp.txt -L | gpg --import
gpg --verify borderwallets.txt.asc      # verifies the hash file
shasum -a 256 borderwallets.html        # compare the result with borderwallets.txt
```

Signing key: `superphatarrow@pm.me` (cross-checkable at pgp.mit.edu). Run the verified file on an offline, air-gapped machine.

## New in this release

- **GridQR:** print a QR of your Regeneration Phrase and scan it back later to reproduce your grid.
- **Compact SeedQR** in the final-word tool.
- **Grid Fingerprint:** a short code printed on each entropy grid and shown on screen. When you regenerate from your phrase, check the fingerprint matches the one on your printed grid to confirm you reproduced the exact same grid. Grids printed before this release do not carry one.
- **Content-Security-Policy:** the tool makes no network requests; the shipped file has `connect-src 'none'`.
- **Authenticated encrypted backups (v2):** see below.
- Hardening across the build and release process, plus a range of correctness and safety fixes from the reviews.

## Backwards compatibility

- Grid derivation is unchanged: any phrase you used before reproduces the identical grid.
- Encrypted backups from earlier versions (v1, including 1.0.5) still decrypt with this build.

## Encrypted backup format (v2)

New encrypted backups are written in an authenticated v2 format that detects tampering with the file's metadata. Old v1 backups continue to open normally. One-way limit worth noting: a backup created with this version needs this version or newer to decrypt, so if you keep pinned offline copies of older releases, keep a copy of this one alongside your backups.

## Reproduce the build yourself

The distributed `borderwallets.html` is a deterministic build of the source. Anyone can rebuild and compare it without trusting the release machine:

```
git checkout <this release's tag>
npm run build        # no npm install needed; build.js uses Node built-ins only
shasum -a 256 dist/borderwallets.html   # compare with borderwallets.txt
```
