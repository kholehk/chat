/* eslint-disable no-underscore-dangle */
const { hostname } = window.location;
const url = `wss://${hostname}:5000`;

function showMessage(message) {
  const messageElem = document.createElement('li');

  messageElem.innerHTML = message;
  document.querySelector('#messages').append(messageElem);
}

function initSocket(_url) {
  const _socket = new WebSocket(_url);

  _socket.onmessage = (event) => {
    const incomingMessage = event.data;

    showMessage(incomingMessage);
  };

  _socket.onclose = (event) => console.log(`Closed ${event.code}`);

  return _socket;
}

let socket = initSocket(url);

const formPublish = document.querySelector('#publish');
formPublish.addEventListener('submit', (event) => {
  event.preventDefault();

  const elementsMessage = event.target.elements.message;
  const outgoingMessage = elementsMessage.value;

  if (!outgoingMessage.trim()) return;

  elementsMessage.value = '';

  socket = socket || initSocket(url);
  socket.send(outgoingMessage);
});
