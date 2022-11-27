/**
  * Creates a new div object containing additional form label and input elements
  * @param {int} optionNumber
 */
function createOption(optionNumber) {
  if (optionNumber > 10) return;
  const label = document.createElement('label');
  label.innerText = `Option ${optionNumber}`;
  label.className = 'form-label';
  label.setAttribute('for', `option${optionNumber}`);

  const input = document.createElement('input');
  input.className = 'form-control';
  input.type = 'text';
  input.name = `option${optionNumber}`;
  input.id = `option${optionNumber}`;

  const div = document.createElement('div');
  div.className = 'mb-3';

  div.appendChild(label);
  div.appendChild(input);
  form.appendChild(div);
}

/**
 * Removes the highest numbered form option
 */
function removeOption() {
  const lastOption = form.lastChild;
  lastOption.remove();
}

const form = document.getElementById('option-container');
const choiceCountInput = document.getElementById('choiceCountInput');
let currentCount = 2;

choiceCountInput.addEventListener('change', (e) =>{
  if (choiceCountInput.value > 10) {
    choiceCountInput.value = 10;
  }
  if (choiceCountInput.value > currentCount) {
    const delta = choiceCountInput.value - currentCount;
    for (let i = 1; i <= delta; i++) {
      createOption(currentCount + i);
    }
  };
  if (choiceCountInput.value <= currentCount) {
    const delta = currentCount - choiceCountInput.value;
    for (let i = 1; i <= delta; i++) {
      removeOption();
    }
    currentCount = parseInt(choiceCountInput.value);
  }
  currentCount = parseInt(choiceCountInput.value);
});
