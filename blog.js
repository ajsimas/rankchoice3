const sql = require('./sql.js');

class Post {
  async load(slug) {
    await sql.loadPost(slug).then((result) => {
      this.title = result.title;
      this.body = result.body;
    });
    return this;
  }
  getParagraphs() {
    return this.body.split('\r\n');
  }
}

module.exports = {Post};
