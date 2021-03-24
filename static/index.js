/* eslint-disable no-param-reassign */
const authorsAmount = 671; // amount character from https://rickandmortyapi.com/api/character

function randomAuthor(amount) {
  return Math.floor(Math.random() * amount) + 1;
}

const messages = document.querySelector('#messages');

function showMessage(msg) {
  let post = { author: 'Guest', message: '' };

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

const nameParams = 'author';

const currentURL = new URL(window.location.href);
const currentAuthor = currentURL.searchParams.get(nameParams);

const author = currentAuthor || randomAuthor(authorsAmount);
console.log(`Author: ${author}`);

function initSocket(_url) {
  messages.innerHTML = '';

  const ws = new WebSocket(_url);

  ws.addEventListener('open', () => ws.send(JSON.stringify({ type: 'login', author })));

  ws.addEventListener('message', async (event) => showMessage(event.data));

  ws.addEventListener('close', (event) => console.log(`Closed: ${event.reason}`));

  return ws;
}

const chatURL = new URL('/chat', origin);
chatURL.searchParams.append(nameParams, `${author}`);

if (!currentAuthor) {
  window.location.assign(chatURL);
} else {
  const WS_HOST = `${origin.replace(/^http/, 'ws')}/chat`;

  let wsChat = initSocket(WS_HOST);

  const interval = setInterval(() => {
    if (wsChat.readyState !== WebSocket.CLOSED) return;

    wsChat = initSocket(WS_HOST);
  }, 10000);

  const formPublish = document.querySelector('#publish');

  formPublish.removeAttribute('hidden');

  formPublish.addEventListener('submit', (event) => {
    event.preventDefault();

    if (wsChat.readyState !== WebSocket.OPEN) return;

    const filteredElements = [...event.target.elements]
      .filter((element) => (element.name && element.value.trim()));

    if (!filteredElements || !filteredElements.length) return;

    const post = filteredElements
      .reduce((acc, { name, value }) => ({ ...acc, [name]: value }), { type: 'chat' });

    wsChat.send(JSON.stringify(post));

    filteredElements
      .forEach((element) => { element.value = ''; });
  });
}
