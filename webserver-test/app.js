const { Server } = require("../src/Index");

const app = new Server({
  isEjs: true,
  port: 8080,
  cookie: true,
  auth: {
    expiresIn: "60s",
    secret: "ABCDEF",
  },
  path: {
    middleware: "middleware",
    routes: "routes",
    views: "views",
    public: "public",
  },
});

app.init((err, server) => {
  if (err) return console.log(err);
  console.log("Servidor iniciado com sucesso na porta", server.port);
});
