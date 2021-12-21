/**
 * @param {Object} options - configuração da middleware
 * @param {Client} client - Client server
 *
 * @param {String} name - Nome da middleware
 */

module.exports = class Middleware {
  constructor(client, options = {}) {
    this.client = client;
    this.name = options.name || false;
  }

  /**
   * @param {*} req
   * @param {*} res
   * @param {Function} next
   * @returns {Object} - retorna resultado da request
   */
  async run(req, res, next) {
    throw new Error("Definir o método run.");
  }
};
