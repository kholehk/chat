const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { deserialize, serialize } = require('serializr');
const { Post } = require('./models/Post');

Post.initModelSchema();

const fileDB = path.resolve(__dirname, 'chat.db');
const table = 'posts';
const schema = {
  id: 'stamp',
  author: 'author',
  msg: 'message',
};

const logger = (err, msg) => console.log(err ? err.message : msg);

const sqlCreate = `CREATE TABLE IF NOT EXISTS ${table}(
  ${schema.id} INTEGER PRIMARY KEY,
  ${schema.author} INTEGER FOREIGN KEY,
  ${schema.msg} TEXT NOT NULL
)`;
const sqlInsert = `INSERT INTO ${table} VALUES (?, ?, ?)`;

const clients = new Set();

function onSocketConnect(ws) {
  clients.add(ws);
  const db = new sqlite3.Database(`${fileDB}`, (err) => logger(err, `Conected to the database: ${fileDB} ...`));

  db.serialize(() => {
    db.run(sqlCreate, (err) => logger(err, `Table: "${table}" created`))
      .each(`SELECT * FROM ${table}`, (err, row) => {
        if (err) return;
        const { id, author, msg } = schema;
        console.log(`Stamp: ${row[id]}, Author: ${row[author]}, Msg: ${row[msg]}`);
        deserialize(
          Post,
          { [author]: row[author], [msg]: row[msg] },
          (e, result) => {
            if (e) return;
            ws.send(JSON.stringify(serialize(result)));
          },
        );
      });
  });

  ws.on('message', (data) => {
    db.serialize(() => {
      console.log(`Input Post "${data}" in DB`);
      const { author, message } = data;
      db.run(sqlCreate, (err) => logger(err, `Table: "${table}" created`))
        .run(sqlInsert, [Date.now(), author, message]);
      deserialize(
        Post,
        { author, message },
        (err, result) => {
          if (err) return;
          clients.forEach((client) => client.send(JSON.stringify(serialize(result))));
        },
      );
    });
  });

  ws.on('close', () => { db.close((err) => logger(err, `Close database conection: ${fileDB}`)); clients.delete(ws); });
}

module.exports = { onSocketConnect };
