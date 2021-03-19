const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const express = require('express');
const WebSocket = require('ws');

const fileDB = path.resolve(__dirname, 'chat.db');
const table = 'posts';
const schema = {
  id: 'time',
  msg: 'message',
};

const logger = (err, msg) => console.log(err ? err.message : msg);

const sqlCreate = `CREATE TABLE IF NOT EXISTS ${table}(${schema.id} INTEGER PRIMARY KEY, ${schema.msg} TEXT NOT NULL)`;
const sqlInsert = `INSERT INTO ${table} VALUES (?, ?)`;

const wss = new WebSocket.Server({ port: 5000 });

wss.on('connection', (ws) => {
  const db = new sqlite3.Database(`${fileDB}`, (err) => logger(err, `Conected to the database: ${fileDB} ...`));

  db.serialize(() => {
    db.run(sqlCreate, (err) => logger(err, `Table: "${table}" created`))
      .each(`SELECT * FROM ${table}`, (err, row) => {
        if (err) throw err;
        console.log(`Row: ${row[schema.id]}, ${row[schema.msg]}`);
        ws.send(row[schema.msg]);
      });
  });

  ws.on('message', (data) => {
    db.serialize(() => {
      db.run(sqlCreate, (err) => logger(err, `Table: "${table}" created`))
        .run(sqlInsert, [Date.now(), data]);

      wss.clients.forEach((client) => {
        if (client.readyState !== WebSocket.OPEN) return;

        client.send(data);
      });
    });

    ws.on('close', () => db.close((err) => logger(err, `Close database conection: ${fileDB}`)));
  });
});

const PORT = process.env.PORT || 3000;
const app = express();

app.use(express.static(path.join(__dirname, 'static')));

app.listen(PORT, () => console.log(`Server has been started on port ${PORT} ...`));
