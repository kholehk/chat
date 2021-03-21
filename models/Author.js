const { createModelSchema, primitive, identifier } = require('serializr');

class Author {
  constructor(id, name = 'Guest') {
    this.id = id;
    this.name = name;
  }

  static initModelSchema() {
    createModelSchema(Author, {
      id: primitive(),
      name: identifier(),
    });
  }
}

module.exports = { Author };
