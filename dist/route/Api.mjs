import { controllers } from "../app/controller/Index.controller.mjs";
import decryptRequestMiddleware from "./middleware/DecryptRequest.middleware.mjs";
import authTokenMiddleware from "./middleware/AuthToken.middleware.mjs";

export class Api {
  app;
  prefix = "/api";
  transactionController = controllers.transaction;

  constructor(app) {
    this.app = app;
  }
  // make all api public
  _expose() {
    this.transaction();
  }
  transaction() { }
}
