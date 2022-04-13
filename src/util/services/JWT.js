const jwt = require("jsonwebtoken");

const { promisify } = require("util");

module.exports = class JWT {
  constructor(client) {
    this.client = client;
    this.logout = new Map();
  }

  sign(data) {
    return jwt.sign(
      data,
      this.client?.auth.secret
        ? this.client?.auth.secret
        : this._generateAutoSecret(),
      {
        expiresIn: this.client?.auth.expiresIn,
      }
    );
  }

  async verify(token) {
    const time = this.verifyTimeout(token);
    if (time) return false;

    try {
      const tokenJWT = await promisify(jwt.verify)(
        token,
        this.client?.auth.secret
          ? this.client?.auth.secret
          : this._generateAutoSecret()
      );

      return tokenJWT;
    } catch (err) {
      this.verifyTimeout(token);
      return false;
    }
  }

  verifyTimeout(token) {
    const jwt = this.logout.get(token);
    if (!jwt) return false;
    if (jwt) {
      if (jwt < Date.now() / 1000) {
        this.logout.delete(token);
        return false;
      }
    }

    return true;
  }
  async destroy(token) {
    let intervalCache = null;

    if (this.logout.get(token)) return false;
    const jwt = await this.verify(token);

    if (jwt.exp >= Date.now() / 1000) this.logout.set(token, jwt.exp);
    intervalCache = setInterval(() => {
      console.log(this.verifyTimeout(token));
      if (!this.verifyTimeout(token)) clearInterval(intervalCache);
    }, 1000 * 60);
  }

  _generateAutoSecret() {
    const secretBasic =
      "CHERRY-CODE-" +
      Buffer.from(Date.now() + ".default.timestamp").toString("base64");

    if (!process.env.SERVER_DEFAULT_SECRET)
      process.env.SERVER_DEFAULT_SECRET = secretBasic;
    return secretBasic;
  }
};
