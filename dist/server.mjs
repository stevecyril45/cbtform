import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import express from "express";
import http from "http";
import compression from "compression";
import fileDirName from "./file-dir-name.mjs";
import bodyParser from "body-parser";
import fileUpload from "express-fileupload";
import busboy from "connect-busboy";
import { Api } from "./route/Api.mjs";
import  serveSpaIndexMiddleware  from "./route/middleware/ServeSpaIndex.middleware.mjs";
import allowableDomainMiddleware from "./route/middleware/AllowableDomain.middleware.mjs";
dotenv.config();
const PORT = process.env.PORT || process.env.NODE_ENV;
const port = JSON.stringify(parseInt(PORT));
const { __dirname } = fileDirName(import.meta);
const staticRoot = __dirname + "/public/";
const staticFileRoot = __dirname + "/storage/public/";
// List of servers
const app = express();
const server = http.createServer(app);
const api = new Api(app);
app.set("port", port);
app.use(fileUpload());
app.use(busboy());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(compression());
app.use(allowableDomainMiddleware);

/* other middleware */

/* place any backend routes you have here */

api._expose();
/* end of backend routes */
app.use(serveSpaIndexMiddleware(staticRoot));
app.use(express.static(staticRoot));
app.use(express.static(staticFileRoot));
export function start_server() {
  server.listen(app.get("port"), function () {
    let now = new Date(Date.now());
    let mes = `Starting server at ${now.toLocaleTimeString()}, ${now.toLocaleDateString()} port ${app.get(
      "port"
    )}`;
    console.log(mes);
  });
}
