const FILE_EXT = 'json',
  ITERATIONS = 10000000;

// Functions to open and close a modal
function openModal($el) {
  $el.classList.add('is-active');
}

function closeModal($el) {
  $el.classList.remove('is-active');
}

function closeAllModals() {
  (document.querySelectorAll('.modal') || []).forEach(($modal) => {
    closeModal($modal);
  });
}

// Add a click event on various child elements to close the parent modal
(
  document.querySelectorAll(
    '.modal-background, .modal-close, .modal-card-head .delete, .modal-card-foot .button'
  ) || []
).forEach(($close) => {
  const $target = $close.closest('.modal');

  $close.addEventListener('click', () => {
    closeModal($target);
  });
});

// Add a keyboard event to close all modals
document.addEventListener('keydown', (event) => {
  const e = event || window.event;

  if (e.keyCode === 27) {
    // Escape key
    closeAllModals();
  }
});

const processingModal = document.getElementById('processingModal');
const startProcessing = () => processingModal.classList.add('is-active');
const endProcessing = () => processingModal.classList.remove('is-active');
const updateProcessingStatus = (msg) =>
  (document.getElementById('processingStatus').innerText = msg);

const dropbox = document.getElementById('dropbox'),
  fileElem = document.getElementById('cryptoFileInput');
dropbox.addEventListener('dragenter', dragenter, false);
dropbox.addEventListener('dragover', dragover, false);
dropbox.addEventListener('drop', drop, false);
dropbox.addEventListener(
  'click',
  function (e) {
    if (fileElem) {
      fileElem.click();
    }
  },
  false
);
fileElem.addEventListener(
  'change',
  function () {
    handleFiles(this.files);
  },
  false
);

function dragenter(e) {
  e.stopPropagation();
  e.preventDefault();
}

function dragover(e) {
  e.stopPropagation();
  e.preventDefault();
}

function drop(e) {
  e.stopPropagation();
  e.preventDefault();

  const dt = e.dataTransfer;
  const files = dt.files;

  handleFiles(files);
}

const getFileExtension = (fileName) => fileName.split('.').at(-1);

function handleFiles(files) {
  updateProcessingStatus('Initialising...');
  startProcessing();
  const file = files[0];
  console.log('file :>> ', file);
  if (!file || !file.name) {
    endProcessing();
    alert('Error: Invalid file or missing file name');
    return;
  }
  const ext = getFileExtension(file.name);
  if (ext === FILE_EXT) {
    decryptFile(file);
  } else {
    encryptFile(file);
  }
}
const strength = {
  0: 'Worst',
  1: 'Bad',
  2: 'Weak',
  3: 'Good',
  4: 'Strong',
};

const strengthClass = {
  0: 'is-danger',
  1: 'is-danger',
  2: 'is-danger',
  3: 'is-warning',
  4: 'is-success',
};

const password = document.getElementById('passphrase');
const passwordConfirm = document.getElementById('passphraseConfirm');
const passwordStrengthMeter = document.getElementById(
  'password-strength-meter'
);

password.addEventListener('input', function () {
  const passwordStrengthText = document.getElementById(
    'password-strength-text'
  );
  const val = password.value;
  const result = zxcvbn(val);

  // Update the password strength meter
  passwordStrengthMeter.value = result.score;
  passwordStrengthMeter.classList.remove(
    'is-danger',
    'is-warning',
    'is-success'
  );
  passwordStrengthMeter.classList.add(strengthClass[result.score]);

  // Update the text indicator
  if (val !== '') {
    passwordStrengthText.innerHTML =
      'Strength: ' +
      '<strong>' +
      strength[result.score] +
      '</strong>' +
      "<span class='feedback'>" +
      result.feedback.warning +
      ' ' +
      result.feedback.suggestions +
      '</span';
  } else {
    passwordStrengthText.innerHTML = '';
  }
});
const checkPassphrasesMatch = () => {
  passwordConfirm.classList.toggle(
    'is-danger',
    password.value !== passwordConfirm.value
  );
  password.classList.toggle(
    'is-success',
    password.value === passwordConfirm.value
  );
  passwordConfirm.classList.toggle(
    'is-success',
    password.value === passwordConfirm.value
  );
};
document.querySelectorAll('.crypto-passphrase-inputs').forEach((input) => {
  input.addEventListener('input', checkPassphrasesMatch);
});
function getKeyMaterial() {
  const passwordValue = document.getElementById('passphrase').value;
  const passwordValueConfirm =
    document.getElementById('passphraseConfirm').value;
  if (!passwordValue) throw new Error('Passphrase required!');
  if (passwordValue !== passwordValueConfirm)
    throw new Error('Passphrase inputs do not match!');
  if (passwordStrengthMeter.value !== 4)
    throw new Error('A stronger passphrase is required!');
  const enc = new TextEncoder();
  return window.crypto.subtle.importKey(
    'raw',
    enc.encode(passwordValue),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );
}
function getKey(keyMaterial, salt) {
  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

const encryptFile = async (file) => {
  try {
    const keyMaterial = await getKeyMaterial();
    const salt = window.crypto.getRandomValues(new Uint8Array(32));
    updateProcessingStatus('generating the key...');
    const key = await getKey(keyMaterial, salt);
    updateProcessingStatus('encrypting...');
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encoder = new TextEncoder();
    const info = {
      name: file.name,
      size: file.size,
      type: file.type,
    };
    const reader = new FileReader();
    reader.onload = async (e) => {
      updateProcessingStatus('building encrypted file...');
      const fileAsURL = e.target.result;
      const encoded = encoder.encode(fileAsURL);
      const version = 1;
      const ciphertext = await window.crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv: iv,
        },
        key,
        encoded
      );
      const result = {
        BWEG: true,
        version,
        info,
        iv: btoa(iv),
        salt: btoa(salt),
        iterations: ITERATIONS,
        ciphertext: btoa([...new Uint8Array(ciphertext)]),
      };
      const fileURL = `data:application/json,${JSON.stringify(
        result,
        null,
        2
      )}`;
      const ext = getFileExtension(file.name);
      const fName = file.name.slice(0, file.name.length - (ext.length + 1));
      saveFile(fileURL, `${fName}.BWEG.${FILE_EXT}`);
    };
    reader.readAsDataURL(file);
  } catch (e) {
    endProcessing();
    alert(e);
  }
};

const decryptFile = async (file) => {
  try {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        if (!e.target.result) throw new Error('No file found!');
        const data = JSON.parse(e.target.result);
        if (data.version !== 1)
          throw new Error('Only Version 1 is currently supported');
        if (
          !data.BWEG ||
          !data.iv ||
          !data.salt ||
          !data.iterations ||
          !data.ciphertext
        ) {
          updateProcessingStatus('file not encrypted');
          encryptFile(file);
          return;
        }
        const salt = new Uint8Array(atob(data.salt).split(','));
        const iv = new Uint8Array(atob(data.iv).split(','));
        const ciphertext = new Uint8Array(atob(data.ciphertext).split(','))
          .buffer;
        const keyMaterial = await getKeyMaterial();
        updateProcessingStatus('generating the key...');
        const key = await getKey(keyMaterial, salt);
        updateProcessingStatus('decrypting...');
        const decrypted = await window.crypto.subtle.decrypt(
          {
            name: 'AES-GCM',
            iv: iv,
          },
          key,
          ciphertext
        );
        const decoder = new TextDecoder();
        const decoded = decoder.decode(decrypted);
        if (!decoded.startsWith(`data:${data.info.type};base64,`))
          throw new Error('Failed to decrypt');
        saveFile(decoded, data.info.name);
      } catch (e) {
        endProcessing();
        alert(e);
      }
    };

    reader.readAsText(file);
  } catch (e) {
    endProcessing();
    alert(e);
  }
};

const regenerationInput = document.getElementById('regenerationPhraseInput');
regenerationInput.addEventListener('keydown', (event) => {
  const e = event || window.event;
  const selection = window.getSelection();
  if (e.keyCode === 13) {
    // Enter key
    selection.collapseToEnd();
    return false;
  }
});
regenerationInput.addEventListener('keyup', (event) => {
  const e = event || window.event;
  const selection = window.getSelection();
  if (e.keyCode === 13 || e.keyCode === 8 || e.keyCode === 46) {
    // Enter / backspace / delete key
    return false;
  }
  const inputElement = document.getElementById('regenerationPhraseInput');
  const userInput = `${inputElement.value}`;
  const wordArray = userInput.split(' ');
  const lastWord = wordArray[wordArray.length - 1];
  const found = wordList.find((s) => s.startsWith(lastWord));
  if (lastWord === found || found === undefined) return false;
  const missingLetters = found.slice(lastWord.length) + ' ';
  const suggestedInput = userInput + missingLetters;
  inputElement.value = suggestedInput;
  for (let i = 0; i < missingLetters.length; i++) {
    selection.modify('extend', 'backward', 'character');
  }
});

const saveFile = (fileURL, fileName) => {
  updateProcessingStatus('saving file...');
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = fileURL;
  // the filename you want
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  endProcessing();
};

const tabButtons = document.querySelectorAll('#sectionTabs>ul>li');
const tabSections = document.querySelectorAll('.tab-section');
tabButtons.forEach((btn) =>
  btn.addEventListener('click', (event) => {
    tabButtons.forEach((b) => b.classList.remove('is-active'));
    const target = event.target.parentElement;
    target.classList.add('is-active');
    tabSections.forEach((tabs) =>
      tabs.classList.toggle(
        'is-hidden',
        target.id.replace('TabBtn', '') !== tabs.id
      )
    );
  })
);
document.getElementById('gridSelect').oninput = (event) => {
  document
    .getElementById('entropyTypeField')
    .classList.toggle('is-hidden', event.target.value === 'blank');
};

const rnd11Bit = (limit = 2048) => {
  let small = limit;
  while (small >= limit) {
    const big = crypto.getRandomValues(new Uint16Array(1))[0];
    const bigString = big.toString(2).padStart(16, '0');
    const smallString = bigString.slice(5);
    small = parseInt(smallString, 2);
  }
  return small;
};

const bytesToBinary = (byteArray) =>
  byteArray.map((x) => x.toString(2).padStart(8, '0')).join('');

const generateMnemonic = async () => {
  const entropy = crypto.getRandomValues(new Uint8Array(16));
  const binary = bytesToBinary([...entropy]);
  const hash = await crypto.subtle.digest('SHA-256', entropy);
  const cs = bytesToBinary([...new Uint8Array(hash)]).slice(0, 4);
  const words = (binary + cs)
    .match(/[0-1]{11}/g)
    .map((b) => wordList[parseInt(b, 2)])
    .join(' ');
  return words;
};

const shuffle = (array, seed) => {
  const prng = uheprng();
  let getRandom = rnd11Bit;
  if (seed) {
    prng.initState();
    prng.hashString(seed);
    getRandom = prng;
  }
  for (let i = array.length - 1; i > 0; i--) {
    const j = getRandom(i + 1);
    [array[i], array[j]] = [array[j], array[i]];
  }
  prng.done();
};

const isGoodMnemonic = (mnemonic) => {
  let isGood = true;
  const array = mnemonic.split(' ');
  if (array.length !== 12) return false;
  array.forEach((word) => {
    if (!wordList.includes(word)) isGood = false;
  });
  return isGood;
};

const regenerateSeedGrid = (_event, indemnified) => {
  const mnemonic = document
    .getElementById('regenerationPhraseInput')
    .value.trim();
  if (!isGoodMnemonic(mnemonic) && !indemnified) {
    document
      .querySelector('#regenerationConfirmation')
      .classList.add('is-active');
    return;
  }
  const words = [...wordList];
  shuffle(words, mnemonic);
  const typeOfGrid = document.getElementById('regenerateGridSelect').value;
  const cells = words.map(getCellValue[typeOfGrid]);
  saveGrid(cells, mnemonic, typeOfGrid);
};

const generateSeedGrid = async () => {
  const words = [...wordList];
  const mnemonic = await generateMnemonic();
  const seed = getEntropyType() === '128' ? mnemonic : null;
  shuffle(words, seed);
  const typeOfGrid = getGridType();
  const cells = words.map(getCellValue[typeOfGrid]);
  saveGrid(cells, seed, typeOfGrid);
};

// returns blank, char, num, idx or hex
const getGridType = () => document.querySelector('#gridSelect').value;

// returns 128 or max
const getEntropyType = () => document.querySelector('#entropySelect').value;

const getCellValue = {
  blank: (w) => '    ',
  char: (w) => w.slice(0, 4),
  num: (w) => (wordList.indexOf(w) + 1).toString().padStart(4, '0'),
  idx: (w) => wordList.indexOf(w).toString().padStart(4, '0'),
  hex: (w) => ' ' + (wordList.indexOf(w) + 1).toString(16).padStart(3, '0'),
};

const getHeaderCellStyle = (text) => ({
  content: text,
  styles: { fontStyle: 'bold', fillColor: 220 },
});

const getHeader = () =>
  [
    '',
    'A',
    'B',
    'C',
    'D',
    'E',
    'F',
    'G',
    'H',
    'I',
    'J',
    'K',
    'L',
    'M',
    'N',
    'O',
    'P',
  ].map((n) => getHeaderCellStyle(n));

const getTable = (cells, startIndex = 0) => {
  const table = [getHeader()];
  cells.forEach((cell, index) => {
    const i = startIndex + index;
    const col = (index % 16) + 1;
    const row = Math.floor(index / 16) + 1;
    const rowNumber = Math.floor(i / 16) + 1;
    if (!table[row])
      table[row] = [getHeaderCellStyle(`${rowNumber}`.padStart(3, '0'))];
    table[row][col] = cell;
  });
  table.push(getHeader());
  table.forEach((row) => row.push(row[0]));
  return table;
};

/* cspell:disable */
const saveGrid = (cells, seed, typeOfGrid) => {
  const { jsPDF } = window.jspdf;
  const tableOpts = {
    theme: 'grid',
    styles: {
      cellPadding: 0.3,
      overflow: 'ellipsize',
      fontSize: 8.5,
      halign: 'center',
      valign: 'middle',
    },
    margin: { top: 12, right: 10, bottom: 10, left: 10 },
  };
  const gridType = typeOfGrid === 'blank' ? 'Pattern' : 'Entropy';
  const recovery =
    typeOfGrid === 'blank'
      ? 'Create your pattern here before printing an Entropy Grid'
      : seed
      ? `Recovery Phrase: ${seed}`
      : 'Maximum Entropy Grid - keep this safe, there is no way to regenerate it if lost.';
  const topText = (page) =>
    typeOfGrid === 'blank'
      ? `Pt${page}/2    BWEG No.# ___________  Date: _____________`
      : `Pt${page}/2    BWEG No.# ___________  Date: _____________  Checksum verified?  Y/N   Checksum calculator/method:________________`;
  const logo =
    'data:image/png;base64,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';
  const doc = new jsPDF();
  doc
    .setFontSize(8.5)
    .addImage(logo, 'PNG', 10, 5, 5, 5, 'logo', 'NONE', 0)
    .text(topText(1), 105, 10, { align: 'center' })
    .autoTable({
      body: getTable(cells.slice(0, 1024)),
      ...tableOpts,
    })
    .text(recovery, 105, 285, { align: 'center' })
    .addPage()
    .addImage(logo, 'PNG', 10, 5, 5, 5, 'logo', 'NONE', 0)
    .text(topText(2), 105, 10, { align: 'center' })
    .autoTable({
      body: getTable(cells.slice(1024), 1024),
      ...tableOpts,
    })
    .text(recovery, 105, 285, { align: 'center' })
    .save(`BorderWallet${gridType}Grid.pdf`);
};

let element;
const words = [
  'Are you ready to begin, Satoshi?',
  'Visit borderwallets.com for instructions.',
  'Dont trust, verify.',
  'Not your keys, not your coins.',
];
/* cspell: enable */

function type(words, index = 0) {
  (function writer(i) {
    var string = words[index];
    if (string.length <= i++) {
      element.innerText = string;
      if (words[index] != words[words.length - 1]) {
        setTimeout(function () {
          reverseType(words, index);
        }, 500);
      } else {
        setTimeout(function () {
          reverseType(words, index);
        }, 2000);
      }
      return;
    }
    element.innerText = string.substring(0, i);
    var rand = Math.floor(Math.random() * 100) + 140;
    setTimeout(function () {
      writer(i);
    }, rand);
  })(0);
}

function reverseType(words, index = 0) {
  (function writer(i) {
    var string = words[index];
    if (string.length <= i++) {
      element.innerText = string;
      if (words[index] != words[words.length - 1]) {
        type(words, index + 1);
      } else {
        type(words, 0);
      }
      return;
    }
    element.innerText = string.substring(0, string.length - i);
    var rand = Math.floor(Math.random() * 100) + 140;
    setTimeout(function () {
      writer(i);
    }, rand);
  })(0);
}

window.addEventListener('DOMContentLoaded', () => {
  element = document.querySelector('#text');
  type(words);
});
