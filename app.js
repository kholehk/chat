const path = require('path');
const express = require('express');
const { Server } = require('ws');

const { onSocketConnect } = require('./chatWS');

const PORT = process.env.PORT || 3000;

const wss = new Server({ noServer: true });

const app = express();

app.use(express.static(path.join(__dirname, 'static')));

app.get('/ws', (req) => {
  if (
    !req.headers.upgrade
    || req.headers.upgrade.toLowerCase() !== 'websocket'
    || !req.headers.connection.match(/\bupgrade\b/i)
  ) return;

  wss.handleUpgrade(req, req.socket, Buffer.alloc(0), onSocketConnect);
});

app.listen(PORT, () => console.log(`Server has been started on port ${PORT} ...`));
