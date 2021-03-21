const { default: axios } = require('axios');
const {
  createModelSchema, primitive, reference,
} = require('serializr');
const { Author } = require('./Author');

async function fetchAuthorFromAPI(id) {
  const authorsURL = 'https://rickandmortyapi.com/api/character/';
  let author = new Author(id);

  try {
    const { data } = await axios(authorsURL + id);
    author = { ...author, name: data.name };
  } catch (e) {
    console.log(e.message);
    author = { ...author, name: 'Guest' };
  }

  return author;
}

async function findAuthorById(id, callback) {
  const author = await fetchAuthorFromAPI(id);

  callback(null, author);
}

class Post {
  constructor(msg) {
    this.message = msg ?? '';
    this.author = 0;
  }

  static initModelSchema() {
    Author.initModelSchema();

    createModelSchema(Post, {
      message: primitive(),
      author: reference(Author, findAuthorById),
    });
  }
}

module.exports = { Post };
