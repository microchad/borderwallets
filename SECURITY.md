# Security Policy

## Reporting a vulnerability

Please report suspected vulnerabilities privately, **not** as a public GitHub
issue.

- Email: **superphatarrow@pm.me**
- PGP: `6067FDB146D964B9BF5731FF876821EC200DC4DC`
  (`curl https://borderwallets.com/pgp.txt -L | gpg --import`)

Encrypt your report if it describes a way to recover a user's seed words,
pattern, or Entropy Grid.

Please include:

- the version or release of `borderwallets.html` you tested
- the browser and operating system
- concrete steps to reproduce, and what an attacker gains

### What to expect

This is a small, volunteer-maintained project. We aim to acknowledge a report
within 7 days and to give an initial assessment within 30 days. Fixes for issues
that are reachable in practice are prioritised over theoretical ones. We will
credit reporters who want it.

## Before you report

Two things are worth checking first.

### The threat model

Border Wallets treats the **Entropy Grid as the seed** — it carries the entropy
— and the **pattern as an additional layer**, analogous to a BIP-39 passphrase
on top of a seed phrase. An attacker holding your grid must still brute-force
your pattern; an attacker without your grid gains nothing from a guessable
pattern.

Grids should be protected accordingly. See
[Best Practices](https://borderwallets.com/docs/best-practices) and
[Gotchas](https://borderwallets.com/docs/gotchas).

Please read the model above before reporting a grid-exposure finding — a report
that assumes the grid is public material is working from a different threat
model than the tool's.

### Grid derivation is a compatibility format

Deterministic grid regeneration (UHEPRNG seeded from the recovery phrase,
driving a Fisher-Yates shuffle — see [TECHNICAL.md](./TECHNICAL.md)) is not an
implementation detail of this repository. Third parties implement it too,
including Sparrow Wallet's native Border Wallets feature.

Changing that derivation would cause existing recovery phrases to regenerate a
*different* grid, silently invalidating memorised patterns and losing user
funds. Reports recommending a different PRNG or shuffle are welcome as analysis,
but any change would have to ship as an explicitly versioned grid v2 alongside
permanent v1 support. Please account for that in what you propose.

## Scope

**In scope** — anything that could expose a user's seed words, pattern, or grid,
or cause a grid to be generated or regenerated incorrectly:

- `src/www/` and the built `dist/borderwallets.html`
- grid generation, regeneration, and the final-word calculator
- the encryption/decryption feature (`TECHNICAL.md` documents the parameters)
- the release signing process

**Out of scope:**

- `package.json` dependencies. These run a local development server only and
  never ship. See [DEPENDENCIES.md](./DEPENDENCIES.md).
- Advisories against vendored libraries that are not reachable from this
  codebase. DEPENDENCIES.md records the current analysis; if you believe a
  listed advisory *is* reachable, that is very much in scope — say which call
  path reaches it.
- Self-inflicted issues in an offline single-user tool, such as slow input
  parsing on text the user typed themselves.
- The online demonstration version at `www.borderwallets.com`, which warns on
  load that it must not be used for real funds.

## Verifying a release

Every release publishes three files: `borderwallets.html`, `borderwallets.txt`
(its SHA-256), and `borderwallets.txt.asc` (a detached PGP signature over the
hash file).

Full step-by-step instructions, with expected output, are on the
[download page](https://borderwallets.com/docs/download-the-entropy-grid-generator).
In short:

```sh
curl https://borderwallets.com/pgp.txt -L | gpg --import
gpg --verify borderwallets.txt.asc      # verifies the hash file
shasum -a 256 borderwallets.html        # compare with borderwallets.txt
```

The signature covers the hash file, so both steps are required — verifying the
signature alone does not verify the tool.

The signing key fingerprint can be cross-checked independently at
[pgp.mit.edu](https://pgp.mit.edu/pks/lookup?search=superphatarrow%40pm.me&op=index).

## Using the tool safely

Download `borderwallets.html` and run it on an offline, air-gapped machine. The
tool makes no network requests, but that guarantee only holds for a file whose
signature you have verified.
