import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import express from "express";
import http from "http";
import https from "https"; // Added for HTTPS support
import compression from "compression";
import fileDirName from "./file-dir-name.mjs";
import bodyParser from "body-parser";
import fileUpload from "express-fileupload";
import busboy from "connect-busboy";
import { Api } from "./route/Api.mjs";
import serveSpaIndexMiddleware from "./route/middleware/ServeSpaIndex.middleware.mjs";
import allowableDomainMiddleware from "./route/middleware/AllowableDomain.middleware.mjs";

dotenv.config();
const PORT = process.env.PORT || process.env.NODE_ENV;
const port = JSON.stringify(parseInt(PORT));
const { __dirname } = fileDirName(import.meta);
const staticRoot = __dirname + "/public/";
const staticFileRoot = __dirname + "/storage/uploads/";

// SSL directory: Use SSL_DIR env var if set (shared across projects), otherwise fallback to local ./ssl
const sslDir = process.env.SSL_DIR ? path.resolve(process.env.SSL_DIR) : path.join(__dirname, 'ssl');
const certPath = path.join(sslDir, 'localhost+ip.crt');
const keyPath = path.join(sslDir, 'localhost+ip.key');

// List of servers
const app = express();
const api = new Api(app);
app.set("port", port);
app.use(fileUpload());
app.use(busboy());
app.use(express.json({ limit: '20mb' }));        // for JSON
app.use(express.urlencoded({ limit: '20mb', extended: false }));
app.use(compression());
app.use(allowableDomainMiddleware);

/* other middleware */

/* place any backend routes you have here */

api._expose();
/* end of backend routes */
app.use("/storage/uploads",express.static(staticFileRoot));
app.use(express.static(staticRoot));
app.use(serveSpaIndexMiddleware(staticRoot));


export function start_server() {
  // Check for SSL files
  const hasSsl = fs.existsSync(certPath) && fs.existsSync(keyPath);

  let server;
  if (hasSsl) {
    // Load SSL options
    const options = {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath)
    };
    server = https.createServer(options, app);
    console.log(`🔒 Starting HTTPS server with SSL certs from ${sslDir}`);
  } else {
    // Fallback to HTTP and prompt user
    server = http.createServer(app);
    console.log('⚠️  No SSL certs found. Starting HTTP server.');
    console.log('💡 Set SSL_DIR env var to your shared SSL directory or run "npm run ssl" to generate local certs.');
  }

  server.listen(app.get("port"), process.env.IP, function () {
    let now = new Date(Date.now());
    const protocol = hasSsl ? 'HTTPS' : 'HTTP';
    let mes = `Starting ${protocol} server at ${now.toLocaleTimeString()}, ${now.toLocaleDateString()} port ${app.get(
      "port"
    )}`;
    console.log(mes);
  });
}
