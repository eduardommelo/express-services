module.exports = class RouterManager {
  constructor(client, app) {
    this.client = client;
    this.app = app;

    this.routes = {};
  }

  /**
   * @public
   * @param {*} groups
   * @returns {Object} - Objeto do grupo de rotas
   */
  create(groups) {
    if (this._validate(groups)) this.routes = groups;
    return groups;
  }

  /**
   * @private
   * @param {*} data
   * @returns Valida os parametros passado no objeto
   */
  _validate(data) {
    if (!data?.route) return new Error("Informe a rota pai do grupo.");
    return true;
  }
};
