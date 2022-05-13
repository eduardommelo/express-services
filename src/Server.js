const express = require("express");
const cookieParser = require("cookie-parser");
const expressFileUpload = require("express-fileupload");
const https = require("https");
const { readdirSync, statSync, readFileSync } = require("fs");
const cors = require("cors");
const { extname } = require("path");
const ejs = require("ejs");
const { ERROR_PAGE } = require("../src/presentation/ServerRequest");

const RouterManager = require("../src/util/services/RouterManager");
const JWT = require("./util/services/JWT");

/**
 * @param {Object} options - Responsável pelas opçoes de configuração de server-side.
 *
 * @param {String} routes  - responsável por configurar a raiz do arquivo no qual fica repsonsável por rotas
 * @param {Boolean} isCors - Definir se vai utilizar cors ou não
 * @param {isEjs} isEjs    - Se o servidor irá utilizar engine view
 * @param {String} errors  - Configura a pagina que responsabiliza de erro de requisições
 * @param {Number} ports   - Reponsável por configurar qual porta vai ouvir, por padrão é 3000
 * @param {Object[]} service - Responsável por configurar os serviços como os erros de request de cada status especifico
 * @param {Array} depedences - Importar funções como Discord, JWT e afins.
 */

module.exports = class Client {
  constructor(options = {}) {
    this.app = express();

    this.routes = options.routes || "routes";
    this.auth = options.auth || false;
    this.cors = options.cors
      ? this._verifyParams(options.cors, "cors") || false
      : false;
    this.isEjs = options.ejs || false;

    this.isCookie = options.cookie || false;
    this.upload = options.upload || false;
    this.ssl = options.ssl
      ? this._verifyParams(options.ssl, "ssl") || false
      : false;

    this.path = {
      routes: options.path?.routes || "routes",
      middleware: options.path?.middleware || "middleware",
      views: options.path?.views || `views`,
      public: options.path?.public || `public`,
    };

    this.errors = options?.errors || false;
    this.port = options.port || 3000;
    this.service = {
      middleware: [],
    };

    this.extended = {};
    this.depedences = options?.depedences || {};

    this.group = new RouterManager(this, this.app);
    this.jwt = new JWT(this);
  }

  /**
   * @public
   * @param {*} callback - Inicializa o servidor
   */
  init(callback) {
    try {
      this.app.use(express.json());
      this.app.use(
        express.urlencoded({
          extended: true,
        })
      );

      if (this.upload)
        this.app.use(
          this.upload === true
            ? expressFileUpload()
            : expressFileUpload({
                limits: this.upload.limits,
              })
        );
      this.app.use(this.cors ? cors(this.cors) : cors());

      if (this.isCookie) this.app.use(cookieParser());
      if (this.isEjs) {
        this.app.engine("html", ejs.renderFile);
        this.app.set("view engine", "html");
        this.app.set("views", this.path.views);
      }
      this.app.use(express.static(this.path.public));

      if (this.path.middleware) this._initMiddleware(this.path.middleware);
      if (this.path.routes) this._initRoutes(this.path.routes);
      if (this.errors) this._onResolveErrorPage();

      this._expressListen(callback);
    } catch (err) {
      callback(err);
    }
  }

  /**
   * @private Middleware de erros de rota
   * @return Object
   */
  _onResolveErrorPage() {
    this.app.get("*", (req, res, next) => {
      res.status(404);
      if (res.statusCode !== 200) {
        if (this.errors?.api)
          return res.status(res.statusCode).json(this.errors?.api);

        res
          .status(res.statusCode)
          .render(
            !this.errors[res.statusCode] || !ERROR_PAGE[res.statusCode]
              ? this.errors.all
              : this.errors[res.statusCode],
            {
              status: res.statusCode,
              message: ERROR_PAGE[res.statusCode],
            }
          );
      } else next();
    });
  }

  /**
   * @private
   * @param {*} dir
   * @return Object
   * Inicia as middleware antes de fazer requisição, avaliando os requerimentos.
   */
  _initMiddleware(dir) {
    this._loadFolders(dir, (fileReq, file, filePath) => {
      if (typeof fileReq !== "function")
        return new Error("Instance middlewares is not declareted.");
      fileReq = new fileReq(this);
      this.service.middleware[fileReq.name] = (req, res, next) =>
        fileReq.run(req, res, next);
    });
  }

  /**
   * @private
   * Inicializa o servidor express
   */
  _expressListen(callback) {
    const resolve = this._resolveServer();
    resolve.listen(this.port, (err) => callback(err, this));
  }

  _resolveServer() {
    return this.ssl
      ? https.createServer(
          {
            key: readFileSync(this.ssl.key),
            cert: readFileSync(this.ssl.cert),
          },
          this.app
        )
      : this.app;
  }

  /**
   * @private
   * @param dir {String}
   * Inicializa as rotas do servidor de acordo com o path
   */
  _initRoutes(dir) {
    this._loadFolders(dir, (fileReq, file, filePath) => {
      if (typeof fileReq !== "function")
        return new Error("Instance routes is not declareted.");

      fileReq = new fileReq(this);

      const route = fileReq.group
        ? this.group.routes[fileReq.group].route + fileReq.route
        : fileReq.route;

      if (fileReq.publicURL)
        this.app[fileReq.method.toLowerCase()](
          route,
          this._onMiddlewareStart(fileReq.middleware),
          async (req, res) => {
            const routeReturn = await fileReq.run(req, res);
            res.render(fileReq.publicURL + ".ejs", routeReturn);
          }
        );
      else
        this.app[fileReq.method.toLowerCase()](
          route,
          this._onMiddlewareStart(fileReq.middleware),
          async (req, res, next) => await fileReq.run(req, res, next)
        );
    });
  }
  /**
   * @private
   * Inicializa as rotas do servidor.
   * @param foler {String} pasta dos arquivos
   * @param callback {Function} callbacks da função
   */
  _loadFolders(folder, callback = () => {}) {
    const files = readdirSync(folder);
    for (const file of files) {
      const filePath = `${folder}/${file}`;
      if (!statSync(filePath).isDirectory()) {
        if (extname(file) === ".js") {
          const fileReq = require(process.cwd() + "/" + filePath);
          callback(fileReq, file, filePath);
        }
      } else this._loadFolders(`${folder}/${file}`, callback);
    }
  }

  /**
   * @param {*} middlewares
   * @returns {Array} - retorna as middleware
   */
  _onMiddlewareStart(middlewares) {
    let callbacks = [];
    for (let i = 0; i < middlewares.length; i++) {
      callbacks.push(this.service.middleware[middlewares[i]]);
    }

    return callbacks;
  }

  /**
   *  Método de validação de informações
   */
  _verifyParams(options, type) {
    switch (type) {
      case "cors":
        if (!options?.origin) throw new Error("[CORS] origin has undefined");
        if (!options?.optionsSuccessStatus)
          throw new Error("[CORS] optionsSuccessStatus has undefined");
        break;
      case "ssl":
        if (!options?.cert) throw new Error("[SSL] cert has undefined");
        if (!options?.key) throw new Error("[SSL] key has undefined");
        break;
    }
  }

  extend(instance) {
    this.extended = instance;
  }
};
