# [borderwallets.com](https://borderwallets.com)
Welcome to the Bitcoin Border Wallets repo.
<br>
<br>
Border Wallets offer Bitcoiners a way to quickly, easily, and reliably generate, memorise and recall Bitcoin wallet seed words using user-generated patterns or cell co-ordinates combined with randomly shuffled 'grids' of Bitcoin seed words.
<br>
<br>
Border Wallets are a new idea, so if you have not yet familiarised yourself with what they are or how they work with our Seed Grid Generator,
please visit our website [BorderWallets.com](https://borderwallets.com) to learn about it.
<br>
<br>
If you have any ideas for how to make this project better and to reach more people, especially in our target demographic,
or if you would like to help or contribute to the project, we'd love to hear from you.
<br><br>
Want to connect? [@ghostofmtc](https://twitter.com/GhostofMtc)
<br><br>
MY CO-CONSPIRATORS
Thank you, SuperPhatArrow for your time, skills, insights and kind guidance, and BitcoinQNA for your encouragement, invaluable help and support. 

## Verifying your download

Every release is PGP-signed. **Verify before you use it** — the tool generates
Bitcoin seed words, and a tampered copy could hand them to someone else.

Each release publishes `borderwallets.html`, `borderwallets.txt` (its SHA-256)
and `borderwallets.txt.asc` (a detached signature over the hash file):

```sh
curl https://borderwallets.com/pgp.txt -L | gpg --import
gpg --verify borderwallets.txt.asc      # verifies the hash file
shasum -a 256 borderwallets.html        # compare with borderwallets.txt
```

Both steps are needed — the signature covers the hash file, not the tool
directly. Full instructions with expected output are on the
[download page](https://borderwallets.com/docs/download-the-entropy-grid-generator),
and the signing keys are documented at
[borderwallets.com/docs/pgp-keys](https://borderwallets.com/docs/pgp-keys).

Run the verified file on an offline, air-gapped machine.

## Security

To report a vulnerability, please see [SECURITY.md](https://github.com/microchad/borderwallets/blob/gh-pages/SECURITY.md) — do not open a public issue for anything that could expose a user's seed words, pattern or Entropy Grid.

[DEPENDENCIES.md](https://github.com/microchad/borderwallets/blob/gh-pages/DEPENDENCIES.md) records what actually ships inside `borderwallets.html`, where it came from, and the current advisory analysis.

## Development

Please see [CONTRIBUTING.md](https://github.com/microchad/borderwallets/blob/gh-pages/CONTRIBUTING.md)
