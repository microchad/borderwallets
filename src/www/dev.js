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

// Add a click event on buttons to open a specific modal
// (document.querySelectorAll('.js-modal-trigger') || []).forEach(($trigger) => {
//   const modal = $trigger.dataset.target;
//   const $target = document.getElementById(modal);

//   $trigger.addEventListener('click', () => {
//     openModal($target);
//   });
// });

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
  console.log('mnemonic :>> ', mnemonic);
  let isGood = true;
  const array = mnemonic.split(' ');
  console.log('array.length :>> ', array.length);
  if (array.length !== 12) return false;
  array.forEach((word) => {
    if (!wordList.includes(word)) isGood = false;
  });
  console.log('isGood :>> ', isGood);
  return isGood;
};

const regenerateSeedGrid = (_event, indemnified) => {
  const mnemonic = document
    .getElementById('regenerationPhraseInput')
    .value.trim();
  console.log('indemnified :>> ', indemnified);
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
      ? `Pt${page}/2    BWSG No.# ___________  Date: _____________`
      : `Pt${page}/2    BWSG No.# ___________  Date: _____________  Checksum verified?  Y/N   Checksum calculator/method:________________`;
  const doc = new jsPDF();
  doc
    .setFontSize(8.5)
    .text(topText(1), 105, 10, { align: 'center' })
    .autoTable({
      body: getTable(cells.slice(0, 1024)),
      ...tableOpts,
    })
    .text(recovery, 105, 285, { align: 'center' })
    .addPage()
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
