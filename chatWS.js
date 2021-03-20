const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const fileDB = path.resolve(__dirname, 'chat.db');
const table = 'posts';
const schema = {
  id: 'time',
  msg: 'message',
};

const logger = (err, msg) => console.log(err ? err.message : msg);

const sqlCreate = `CREATE TABLE IF NOT EXISTS ${table}(${schema.id} INTEGER PRIMARY KEY, ${schema.msg} TEXT NOT NULL)`;
const sqlInsert = `INSERT INTO ${table} VALUES (?, ?)`;

const clients = new Set();

function onSocketConnect(ws) {
  clients.add(ws);
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
      console.log(`Input Post "${data}" in DB`);
      db.run(sqlCreate, (err) => logger(err, `Table: "${table}" created`))
        .run(sqlInsert, [Date.now(), data]);

      clients.forEach((client) => client.send(data));
    });
  });

  ws.on('close', () => { db.close((err) => logger(err, `Close database conection: ${fileDB}`)); clients.delete(ws); });
}

module.exports = { onSocketConnect };
