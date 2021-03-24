/* eslint-disable max-classes-per-file */
const { default: axios } = require('axios');
const {
  createModelSchema, primitive, identifier, reference, deserialize,
} = require('serializr');

const authorsURL = 'https://rickandmortyapi.com/api/character/';
const guest = 'Guest';

class Author {
  constructor(id = 0) {
    this.id = id;
    this.name = null;
  }

  async initFromAPI() {
    try {
      const { data } = await axios(authorsURL + this.id);
      this.name = data.name;
    } catch (e) {
      console.log(e.message);
      this.name = guest;
    }
  }

  async initFromDB() {
    this.name = 'Guest';
  }
}

createModelSchema(Author, {
  id: identifier(),
  name: primitive(),
});

module.exports = { Author };
