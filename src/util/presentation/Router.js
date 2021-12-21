/**
 * @param {Object} client - Client server
 * @param {Object} options - Opções da rota do servidor.
 *
 * @param {Boolean | String} route - Configuração das rotas
 * @param {String} method - Qual metodo de requisição a rota vai aceitar
 * @param {Array} middleware - Qual middleware ira avaliar a requisição
 * @param {String} publicURL - Caso esteja ativado engine view e caso seja render front, informar qual page view
 * @param {String} group - Grupo de rotas
 */

module.exports = class Router {
  constructor(client, options = {}) {
    this.client = client;
    this.route = options.route || false;
    this.method = options.method || "GET";
    this.middleware = options.middleware || [];
    this.publicURL = options.publicURL || false;
    this.group = options.group || "";
  }

  /**
   * @param {*} req
   * @param {*} res
   * @returns {Object} - retorna response da request
   */

  async run(req, res) {
    throw new Error("Definir o método run.");
  }
};
