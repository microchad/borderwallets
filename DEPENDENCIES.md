# Dependencies

This file records what actually ships inside `dist/borderwallets.html`, where it
came from, and which published advisories apply to it. It exists because the
usual tooling gives a misleading answer for this repository — see
[Why not Dependabot](#why-not-dependabot).

Last audited: **2026-08-01**.

## What ships and what does not

`src/build.js` uses only Node built-ins (`fs`, `util`, `path`). It inlines the
scripts and stylesheets referenced by `src/www/dev.html` into a single file at
`dist/borderwallets.html`.

- **Everything users run is vendored in `src/www/`.** It is committed to this
  repository and reviewable in the diff.
- **Nothing in `package.json` reaches users.** Those four packages exist only to
  run the local hot-reload server in `src/server.js`.

Any dependency question about the shipped tool is a question about `src/www/`.

## Shipped libraries

| File | Library | Version | Provenance |
|---|---|---|---|
| `src/www/zxcvbn.js` | [zxcvbn](https://github.com/dropbox/zxcvbn) (Dropbox) | 4.4.2 | **Byte-verified** — see below |
| `src/www/pdf.js` | [jsPDF](https://github.com/parallax/jsPDF) + [jsPDF-AutoTable](https://github.com/simonbengtsson/jsPDF-AutoTable) | 2.5.1 (built 2022-01-28) + 3.5.23 | Asserted from embedded banners; **not** byte-verifiable |
| `src/www/qrcode.js` | QR Code Generator for JavaScript (Kazuhiko Arase) | fork | Rewritten in-tree; not tracking upstream |
| `src/www/wordlist.js` | BIP-39 English wordlist | — | Data, not code (2048 words) |
| `src/www/uheprng.js` | GRC UHEPRNG (public domain) | — | Adapted in-tree; see `TECHNICAL.md` |

### Verifying zxcvbn

`src/www/zxcvbn.js` is upstream `zxcvbn@4.4.2` `dist/zxcvbn.js` with only the
trailing `//# sourceMappingURL=zxcvbn.js.map` comment removed. To confirm:

```sh
npm pack zxcvbn@4.4.2 && tar xzf zxcvbn-4.4.2.tgz
perl -0pe 's{\n?//# sourceMappingURL=zxcvbn\.js\.map\n?$}{}' \
  package/dist/zxcvbn.js > stripped.js
printf '\n' >> stripped.js
shasum -a 256 stripped.js src/www/zxcvbn.js
# both: 801de956c19008f788bad1bea09f2825cf0e59f4a1ed9a6ae91b98992ea7a896
```

### jsPDF provenance is weaker

`src/www/pdf.js` concatenates jsPDF and its AutoTable plugin, and the result has
been reformatted — it is not byte-identical to any upstream `dist/` file, and
neither upstream artifact appears in it verbatim. The versions above are taken
from the banners embedded in the file (`Version 2.5.1 Built on 2022-01-28…`,
`AutoTable plugin v3.5.23`).

A reviewer therefore cannot mechanically confirm this file is unmodified
upstream code. That is a known gap. If this file is ever regenerated, vendor the
upstream `dist/` artifacts unmodified and do any wrapping or concatenation in
`src/build.js`, so provenance stays checkable.

## Advisory status

`jspdf-autotable`, `zxcvbn`, and `qrcode-generator` have no published advisories
of any kind.

jsPDF 2.5.1 is within the affected range of **12** advisories (2 critical, 8
high, 2 medium). None are reachable from this codebase.

### The entire jsPDF call surface

From `saveGrid()` in `src/www/dev.js`:

```
new jsPDF()  ·  setFontSize  ·  addImage(…, 'PNG', …)  ·  text
autoTable  ·  addPage  ·  save('BorderWallet<gridType>Grid.pdf')
```

No `addJS`, no AcroForms, no annotations, no `setDocumentProperties`, no
`addFont`/`loadFile`, no `output()`, no non-PNG images. The filename passed to
`save()` is built from a fixed dropdown value, not free text.

### Reachability

| Advisory | Sev | Requires | Reachable |
|---|---|---|---|
| GHSA-f8cm-6447-x5h2 | critical | font/file loading (`addFont`, `loadFile`) | No |
| GHSA-wfv2-pwc8-crg5 | critical | `output('…newwindow')` | No — uses `save()` |
| GHSA-9vjf-qc39-jprp | high | `addJS` | No |
| GHSA-p5xg-68wr-hm3m | high | AcroForm `RadioButton.createOption` | No |
| GHSA-pqxr-3g65-p328 | high | `AcroFormChoiceField` | No |
| GHSA-7x6v-j9x4-qf24 | high | FreeText annotations | No |
| GHSA-67pg-wm7f-q7fj | high | GIF decoding | No — PNG only |
| GHSA-95fx-jjr5-f39c | high | BMP decoding | No — PNG only |
| GHSA-cjw8-79x6-5cj4 | medium | `addJS` | No |
| GHSA-vm32-vv63-w422 | medium | XMP metadata | No |
| GHSA-8mvj-3j78-4qmw | high | input parsing (DoS) | Self-inflicted only |
| GHSA-w532-jxjh-hjhj | high | input parsing (ReDoS) | Self-inflicted only |

The two DoS entries can in principle be triggered by text the user types into
their own regeneration phrase. In an offline single-user tool the only person
affected is the user doing the typing.

Not applicable to 2.5.1: GHSA-57f3-gghm-9mhc (`<2.3.1`), GHSA-vh59-v9r5-4mh4 and
GHSA-3q6f-8grx-pr4v (both `<2.0.0`).

### What would invalidate this analysis

The table above is a claim about **how this tool calls jsPDF**, not about jsPDF.
It stops being true if `saveGrid()` — or anything else — starts using:

- `addJS` or any AcroForm / form-field API
- annotations, including FreeText
- `output()` in any of its new-window or data-URL forms
- `addImage` with GIF, BMP, or any non-PNG source
- `addFont`, `loadFile`, or any path-taking API
- `setDocumentProperties` or XMP metadata

If you add any of these, re-run the audit before releasing.

### On upgrading jsPDF

Deliberately not done. 2.5.1 to current is two major versions and drags AutoTable
across a major too, which means re-verifying every printed grid layout. In a tool
where a silent layout regression is a fund-loss bug, that is a real risk to take
on in exchange for closing zero reachable vulnerabilities. Revisit if the call
surface above ever widens.

## Development dependencies

`fastify`, `fastify-static`, `nodemon`, `ws` — used only by `src/server.js`,
which binds a hot-reload server to `localhost:3000` (plus a WebSocket on 8080).
`src/build.js` removes the hot-reload `<script>` before writing `dist/`.

`npm audit` currently reports 9 findings across this tree (fastify, find-my-way,
nodemon → simple-update-notifier → semver, fastify-static → send, cookie,
light-my-request). All would need major-version bumps to clear, all are
dev-only, and none of them ship. They are accepted, not overlooked.

`package-lock.json` is committed so this set is reproducible rather than
floating. `.npmrc` sets `ignore-scripts=true` so installing them cannot execute
third-party code — see below.

## Release build integrity

The realistic supply-chain path into a signed release is not a CVE in a shipped
library. It is that the machine resolving floating dev dependencies is also the
machine that builds and signs the artifact: a lifecycle script anywhere in that
tree could modify `src/www/` before `src/build.js` reads it.

Three things guard against that:

1. **`package-lock.json` is committed.** Dependency versions are pinned rather
   than re-resolved on every install.
2. **`.npmrc` sets `ignore-scripts=true`.** `npm install` in this repository does
   not execute install hooks.
3. **Releases are built without installing anything.** `src/build.js` needs no
   dependencies. A release build should be made from a clean checkout with no
   `node_modules` present:

   ```sh
   git clone https://github.com/microchad/borderwallets.git
   cd borderwallets
   npm run build          # no npm install — build.js uses Node built-ins only
   ```

   `npm run dev` is the only command that requires `npm install`, and it should
   not be run on a machine used to produce signed releases.

### Reproducible builds

`src/build.js` is deterministic: it concatenates file contents and writes them
out, with no timestamps, no minification and no dependency resolution. Building
the same `src/` twice produces a byte-identical `dist/borderwallets.html`.

Anyone can therefore check that a release matches the source it claims to come
from, without trusting the release machine:

```sh
git checkout <release-tag>
npm run build                        # no npm install
shasum -a 256 dist/borderwallets.html
# compare against borderwallets.txt from the GitHub release
```

Verified on 2026-08-01 at commit `fecd6b0`: rebuilding produced
`ee66cc51e64a680286dd96c019509d2a421a1189f76ffae59435ed7cb4aa0fb6`, unchanged
from the committed artifact.

## Why not Dependabot

Dependabot reads `package.json`. In this repository that means it would open
pull requests for the four dev-only packages that never reach a user, and stay
silent about the vendored libraries in `src/www/` that do. A passing Dependabot
badge here would be assurance about the wrong files.

Re-auditing the shipped libraries is a manual task. The GitHub Advisory API is
the quickest route:

```sh
gh api "/advisories?ecosystem=npm&affects=jspdf&per_page=30" \
  --jq '.[] | [.ghsa_id, .severity,
       ([.vulnerabilities[]|select(.package.name=="jspdf")|.vulnerable_version_range]|join(" ")),
       .summary] | @tsv'
```

Repeat for `jspdf-autotable`, `zxcvbn`, and `qrcode-generator`, then re-check the
call surface above.
