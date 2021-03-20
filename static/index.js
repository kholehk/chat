/* eslint-disable no-underscore-dangle */
const HOST = `${window.location.origin.replace(/^http/, 'ws')}/ws`;
const messages = document.querySelector('#messages');

function showMessage(message) {
  const messageElem = document.createElement('li');

  messageElem.innerHTML = message;
  messages.append(messageElem);
}

function initSocket(_url) {
  messages.innerHTML = '';

  const _ws = new WebSocket(_url);

  _ws.addEventListener('message', (event) => showMessage(event.data));

  _ws.addEventListener('close', (event) => console.log(`Closed: ${event.reason}`));

  return _ws;
}

let ws = initSocket(HOST);

setInterval(() => {
  if (ws.readyState !== WebSocket.CLOSED) return;

  ws = initSocket(HOST);
}, 10000);

const formPublish = document.querySelector('#publish');
formPublish.addEventListener('submit', (event) => {
  event.preventDefault();

  const elementsMessage = event.target.elements.message;
  const outgoingMessage = elementsMessage.value;

  if (
    !outgoingMessage.trim()
    || ws.readyState !== WebSocket.OPEN
  ) return;

  ws.send(outgoingMessage);
  elementsMessage.value = '';
});
