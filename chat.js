const { Database, verbose } = require('sqlite3');
const path = require('path');
const { deserialize, serialize } = require('serializr');
const { Post } = require('./models/Post');
const { Author } = require('./models/Author');

verbose();

const logger = (err, msg) => console.log(err ? err.message : msg);

const fileDB = path.resolve(__dirname, 'chat.db');

const schemaAuthors = {
  table: 'authors',
  id: 'id',
  name: 'name',
};

const schemaPosts = {
  table: 'posts',
  id: 'stamp',
  author: 'author',
  msg: 'message',
};

const sqlCreateAuthors = `CREATE TABLE IF NOT EXISTS ${schemaAuthors.table} (
  ${schemaAuthors.id} INTEGER PRIMARY KEY,
  ${schemaAuthors.name} TEXT NOT NULL
)`;
const sqlInsertAuthor = `INSERT INTO ${schemaAuthors.table} VALUES (?, ?)`;

const sqlCreatePosts = `CREATE TABLE IF NOT EXISTS ${schemaPosts.table} (
  ${schemaPosts.id} INTEGER PRIMARY KEY,
  ${schemaPosts.author} INTEGER NOT NULL,
  ${schemaPosts.msg} TEXT NOT NULL,
  FOREIGN KEY (${schemaPosts.author})
      REFERENCES ${schemaAuthors.table} (${schemaAuthors.id})
         ON DELETE CASCADE
         ON UPDATE NO ACTION
)`;
const sqlInsertPost = `INSERT INTO ${schemaPosts.table} VALUES (?, ?, ?)`;
const sqlAllPosts = `SELECT * FROM ${schemaPosts.table} 
  ORDER BY ${schemaPosts.id} ASC`;

const clients = new Set();

function onSocketConnect(ws) {
  clients.add(ws);
  const db = new Database(fileDB, (err) => logger(err, 'Connected to DB ...'));

  db.serialize(() => db
    .run(sqlCreateAuthors, (err) => logger(err, `Table ${schemaAuthors.table} created`))
    .run(sqlCreatePosts, (err) => logger(err, `Table ${schemaPosts.table} created`))
    .each(sqlAllPosts, (err, row) => {
      if (err) throw err;
      console.dir(row);
      ws.send(JSON.stringify(row));
    }));

  let payload = { type: '', author: 0, message: '' };
  const author = new Author();

  ws.on('message', (data) => {
    try {
      payload = { ...payload, ...JSON.parse(data) };
      const { type, author: id, message } = payload;

      switch (type) {
        case 'login':
          db.serialize(async () => {
            author.id = id;
            await author.initFromAPI();
            console.log(`Login: ${author.id}/${author.name}`);

            db.run(sqlCreateAuthors, (err) => logger(err, `Table ${schemaAuthors.table} created`))
              .run(sqlInsertAuthor, [author.id, author.name], (err) => logger(err, `Author ${author.id}/${author.name} added`));
          });
          break;
        case 'chat':
          db.serialize(() => {
            db.run(sqlCreatePosts, (err) => logger(err, `Table ${schemaPosts.table} created`))
              .run(sqlInsertPost, [Date.now(), author, message]);

            deserialize(
              Post,
              { [schemaPosts.author]: author, [schemaPosts.msg]: message },
              (err, result) => {
                if (err) return;
                clients.forEach((client) => client.send(JSON.stringify(serialize(result))));
              },
            );
          });
          break;
        default:
          break;
      }
    } catch (error) {
      throw new Error(error);
    }
  });

  ws.on('close', () => {
    db.close((err) => logger(err, 'Database connection closed'));
    clients.delete(ws);
  });
}

module.exports = { onSocketConnect };
