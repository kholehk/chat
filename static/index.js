/* eslint-disable no-param-reassign */
/* eslint-disable no-return-assign */
/* eslint-disable no-underscore-dangle */
const HOST = `${window.location.origin.replace(/^http/, 'ws')}/ws`;
const messages = document.querySelector('#messages');
const authorsURL = 'https://rickandmortyapi.com/api/character/';
const authorsAmount = 671;

function randomAuthor() {
  return Math.floor(Math.random() * authorsAmount) + 1;
}

async function login(id) {
  let author = { id };

  try {
    const response = await fetch(authorsURL + id);
    const { name } = await response.json();

    author = { ...author, name };
  } catch { author = { id: 0, name: 'Guest' }; }

  return author;
}

function showMessage(msg) {
  let post = { author: 0, message: '' };

  try {
    post = { ...post, ...JSON.parse(msg) };
  } catch (error) {
    console.log(error.message);
  }

  const authorElement = document.createElement('dt');
  authorElement.innerHTML = post.author;
  messages.append(authorElement);

  const messageElement = document.createElement('dd');
  messageElement.innerHTML = post.message;
  messages.append(messageElement);
}

function initSocket(_url) {
  messages.innerHTML = '';

  const _ws = new WebSocket(_url);

  _ws.addEventListener('message', async (event) => showMessage(event.data));

  _ws.addEventListener('close', (event) => console.log(`Closed: ${event.reason}`));

  return _ws;
}

let ws = initSocket(HOST);

setInterval(() => {
  if (ws.readyState !== WebSocket.CLOSED) return;

  ws = initSocket(HOST);
}, 10000);

async function main() {
  const author = await login(randomAuthor());
  console.log(`Author: ${author.name}`);

  const formPublish = document.querySelector('#publish');

  formPublish.removeAttribute('hidden');

  formPublish.addEventListener('submit', (event) => {
    event.preventDefault();
    if (ws.readyState !== WebSocket.OPEN) return;

    const filteredElements = [...event.target.elements]
      .filter((element) => (element.name && element.value.trim()));

    if (!filteredElements || !filteredElements.length) return;

    const { id } = author;
    const post = filteredElements
      .reduce((acc, { name, value }) => ({ ...acc, [name]: value }), { author: id });

    console.dir(post);

    ws.send(JSON.stringify(post));

    filteredElements
      .forEach((element) => element.value = '');
  });
}

main();
