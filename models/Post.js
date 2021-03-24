const {
  createModelSchema, primitive, reference,
} = require('serializr');
const { Author } = require('./Author');

async function findAuthorById(id, callback) {
  const author = new Author(id);
  await author.initFromDB(id);

  callback(null, author);
}

class Post {
  constructor(msg) {
    this.message = msg ?? '';
    this.author = 0;
  }
}

createModelSchema(Post, {
  message: primitive(),
  author: reference(Author, findAuthorById),
});

module.exports = { Post };
