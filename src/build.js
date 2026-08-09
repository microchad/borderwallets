const fs = require('fs');
const util = require('util');
const path = require('path');
const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);
console.time('Build script took');
console.log('Building HTML file...');
(async () => {
  try {
    let result = await readFile(path.join(__dirname, '/www/dev.html'), 'utf8');
    // Non-greedy so the match ends at the websocket script's own closing tag
    // rather than the last </script> in the document; assert it was removed so a
    // dev-only hot-reload block can never silently survive into the artifact.
    const beforeWsStrip = result;
    result = result.replace(/<script id="websocket">[^]*?<\/script>/, '');
    if (result === beforeWsStrip || result.includes('id="websocket"')) {
      throw new Error(
        'Failed to strip the hot-reload websocket <script>; refusing to build.'
      );
    }
    console.log('Hot reload Web Socket script tags removed...');

    // The dev CSP allows a websocket connection so hot reload works. The
    // distributed file must make no network requests at all. Fail the build
    // rather than ship the permissive policy by accident.
    const DEV_CONNECT_SRC = "connect-src ws://localhost:8080";
    const PROD_CONNECT_SRC = "connect-src 'none'";
    if (!result.includes(DEV_CONNECT_SRC)) {
      throw new Error(
        `Could not find "${DEV_CONNECT_SRC}" in dev.html. The Content-Security-Policy ` +
          `meta tag is missing or has been edited; refusing to build a file whose ` +
          `network policy cannot be verified.`
      );
    }
    result = result.replace(DEV_CONNECT_SRC, PROD_CONNECT_SRC);
    console.log(`Content-Security-Policy tightened to ${PROD_CONNECT_SRC}...`);
    // Every inlined source file is recorded so the build can verify, before it
    // writes anything, that each one appears in the output byte-for-byte.
    const inlinedFiles = [];
    const regex1 = new RegExp(
      /<script class="border-wallets-dev-script" src="(?<path>...*)">[^]*?<\/script>/
    );
    let array1 = regex1.exec(result);
    while (array1 !== null) {
      const scriptLocation = path.join(__dirname, `/www/`, `${array1[1]}`);
      console.log(`Adding script from ${scriptLocation}`);
      const js = await readFile(scriptLocation, 'utf8');
      // Replacement *function*, not a string: as a string, `$$`, `$&`, `$<path>`
      // and similar sequences in the file contents would be interpreted by
      // String.prototype.replace and silently mutate the inlined code. A
      // function returns the replacement verbatim.
      result = result.replace(
        array1[0],
        () => `<script data-identity="${array1[1]}">${js}</script>`
      );
      inlinedFiles.push({ name: array1[1], content: js });
      console.log('array1 :>> ', array1[0], array1[1]);
      array1 = regex1.exec(result);
      console.log('Done!');
    }
    const regex2 = /<link rel="stylesheet" href="(?<path>...*)?">/;
    let array2 = regex2.exec(result);
    while (array2 !== null) {
      const scriptLocation = path.join(__dirname, `/www/`, `${array2[1]}`);
      console.log(`Adding Stylesheet from ${scriptLocation}`);
      const css = await readFile(scriptLocation, 'utf8');
      result = result.replace(
        array2[0],
        () => `<style>
      ${css}
      </style>`
      );
      inlinedFiles.push({ name: array2[1], content: css });
      array2 = regex2.exec(result);
      console.log('Done!');
    }

    // Post-build integrity check: every inlined source file must appear in the
    // output verbatim. Catches any silent corruption (replacement-string `$`
    // handling, a bad regex) before a broken artifact is written and signed.
    for (const { name, content } of inlinedFiles) {
      if (!result.includes(content)) {
        throw new Error(
          `Inlined file "${name}" does not appear verbatim in the build output; ` +
            `refusing to write a possibly corrupted artifact.`
        );
      }
    }
    console.log(`Verified ${inlinedFiles.length} inlined files appear verbatim.`);

    const output = path.join(__dirname, '../dist/borderwallets.html');
    await writeFile(output, result, 'utf8');
    console.log(`Task completed! Built file is available at ${output}`);
  } catch (error) {
    console.log('Build failed', error);
    // Exit non-zero so `npm run git` / `npm run release` stop here instead of
    // committing, pushing and signing a stale or half-built dist/.
    process.exitCode = 1;
  }
  console.timeEnd('Build script took');
})();
