/* eslint-disable no-underscore-dangle */
const HOST = `${window.location.origin.replace(/^http/, 'ws')}/ws`;

function showMessage(message) {
  const messageElem = document.createElement('li');

  messageElem.innerHTML = message;
  document.querySelector('#messages').append(messageElem);
}

function initSocket(_url) {
  const _ws = new WebSocket(_url);

  _ws.onmessage = (event) => showMessage(event.data);

  _ws.onclose = (event) => console.log(`Closed ${event.code}`);

  return _ws;
}

let ws = initSocket(HOST);

const formPublish = document.querySelector('#publish');
formPublish.addEventListener('submit', (event) => {
  event.preventDefault();

  const elementsMessage = event.target.elements.message;
  const outgoingMessage = elementsMessage.value;

  if (!outgoingMessage.trim()) return;

  elementsMessage.value = '';

  ws = ws || initSocket(HOST);
  ws.send(outgoingMessage);
});
