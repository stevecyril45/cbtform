// middleware/serveIndexHtml.mjs
import fs from "fs";
import path from "path";

export default function serveSpaIndexMiddleware(staticRoot) {
  return function (req, res, next) {
    // if the request is not html then move along
    var accept = req.accepts("html", "json", "xml");
    if (accept !== "html") {
      return next();
    }
    // if the request has a '.' assume that it's for a file, move along
    var ext = path.extname(req.path);
    if (ext !== "") {
      return next();
    }
    fs.createReadStream(staticRoot + "index.html").pipe(res);
  };
}
