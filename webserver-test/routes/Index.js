const { Router } = require("../../src/Index");

module.exports = class Index extends Router {
  constructor(client) {
    super(client, {
      route: "/",
      method: "GET",
      publicURL: "index",
    });
    this.client = client;
  }

  async run(req, res) {
    const e = this.client.jwt.sign({
      foobar: true,
    });

    res.cookie("test", e);
    const test = await this.client.jwt.verify(e);

    await this.client.jwt.destroy(e);
    setInterval(async () => {
      await this.client.jwt.verify(e);
    }, 1000 * 5);
  }
};
