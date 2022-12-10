const inputs = document.querySelectorAll('input[type="number');
const error = document.querySelector('#error');
const form = document.querySelector('form');
const map = new Map();

function valuesAreConsecutive() {
  submittedValues = [];
  inputs.forEach((input) => {
    if (!input.value == '') {
      submittedValues.push(parseInt(input.value));
    }
  });
  for (i = 1; i <= submittedValues.length; i++) {
    if (!submittedValues.includes(i)) {
      return false;
    }
    if (i == submittedValues.length) {
      return true;
    }
  }
}

function duplicatesExist() {
  const values = [];
  inputs.forEach((input) => values.push(input.value));
  if (values.length !== values.filter((value, index, self) => self.indexOf(value) === index).length) {
    return true;
  }
}

function findDuplicates() {
  const set = new Set();
  const duplicateSet = new Set();
  for (const value of map.values()) {
    if (!set.has(value)) set.add(value);
    else duplicateSet.add(value);
  }
  for (const input of inputs) {
    if (input.value !== '' && duplicateSet.has(input.value)) {
      input.style.boxShadow = '0 0 5px 1px red';
      input.setCustomValidity = 'Value must be unique';
      input.reportValidity();
    } else input.style.boxShadow = '';
  }
}

function findVotesOOB(input) {
  if (input.value == '') return;
  if (inputs.length < input.value || input.value < 1) {
    input.style.boxShadow = '0 0 5px 1px red';
  }
}

function voteStartsAtOne() {
  const values = [];
  inputs.forEach((input) => values.push(input.value));
  return (values.filter((value) => value == 1))[0] == 1;
}

inputs.forEach((input) => {
  map.set(input.id, input.value);
  findDuplicates();
  input.addEventListener('input', (event) => {
    map.set(event.target.id, event.target.value);
    findDuplicates();
    findVotesOOB(event.target);
  });
});


form.addEventListener('submit', (event) => {
  event.preventDefault();
  const errors = [];
  if (!voteStartsAtOne()) {
    errors.push('Rank selections must start at 1');
  }
  if (duplicatesExist()) {
    errors.push('Rank selections must not contain duplicates');
  } else {
    if (!valuesAreConsecutive()) {
      errors.push('Rank selections must be consecutive. No skipping.');
    }
  }
  if (errors.length > 0) {
    error.style.color = 'red';
    error.innerHTML = '<p class="mb-0">' + errors.join('</p><p class="mb-0">') + '</p>';
    error.style.display = 'block';
  } else {
    form.submit();
    return;
  }
});

error.style.display = 'none';

// Copy URL to clipboard
const copyButton = document.querySelector('#copyUrl');
const clipboardSuccess = document.querySelector('#clipboardSuccess');
clipboardSuccess.style.display = 'none';
copyButton.addEventListener('click', () => {
  navigator.clipboard.writeText(window.location.href).then(() => {
    clipboardSuccess.style.display = 'block';
    setTimeout(() => {
      clipboardSuccess.style.display = 'none';
    }, 5000);
  });
});
