import { controllers } from "../app/controller/Index.controller.mjs";

export class Api {
  app;
  prefix = "/api";
  cardController = controllers.card;
  donationController = controllers.donation;
  partnerController = controllers.partner;
  transactionController = controllers.transaction;
  warehouseController = controllers.warehouse;
  accountController = controllers.account;

  constructor(app) {
    this.app = app;
  }
  // make all api public
  _expose() {
    this.card();
    this.donation();
    this.partner();
    this.transaction();
    this.warehouse();
  }
  card() {
    // A standard route must contain CRUDA
    this.app.post(
      this.prefix + "/card",
      [],
      this.cardController.create.bind(this.cardController)
    ); // Create
    this.app.get(
      this.prefix + "/card",
      [],
      this.cardController.read.bind(this.cardController)
    ); // Read
    this.app.patch(
      this.prefix + "/card/:id",
      [],
      this.cardController.update.bind(this.cardController)
    ); // Update
    this.app.delete(
      this.prefix + "/card/:id",
      [],
      this.cardController.delete.bind(this.cardController)
    ); // Delete
    this.app.get(
      this.prefix + "/cards",
      [],
      this.cardController.all.bind(this.cardController)
    ); // All
  }
  donation() {
    // A standard route must contain CRUDA
    this.app.post(
      this.prefix + "/donation",
      [],
      this.donationController.create.bind(this.donationController)
    ); // Create
    this.app.get(
      this.prefix + "/donation",
      [],
      this.donationController.read.bind(this.donationController)
    ); // Read
    this.app.patch(
      this.prefix + "/donation/:id",
      [],
      this.donationController.update.bind(this.donationController)
    ); // Update
    this.app.delete(
      this.prefix + "/donation/:id",
      [],
      this.donationController.delete.bind(this.donationController)
    ); // Delete
    this.app.get(
      this.prefix + "/donations",
      [],
      this.donationController.all.bind(this.donationController)
    ); // All
  }
  partner() {
    // A standard route must contain CRUDA
    this.app.post(
      this.prefix + "/partner",
      [],
      this.partnerController.create.bind(this.partnerController)
    ); // Create
    this.app.get(
      this.prefix + "/partner",
      [],
      this.partnerController.read.bind(this.partnerController)
    ); // Read
    this.app.patch(
      this.prefix + "/partner/:id",
      [],
      this.partnerController.update.bind(this.partnerController)
    ); // Update
    this.app.delete(
      this.prefix + "/partner/:id",
      [],
      this.partnerController.delete.bind(this.partnerController)
    ); // Delete
    this.app.get(
      this.prefix + "/partners",
      [],
      this.partnerController.all.bind(this.partnerController)
    ); // All
  }
  transaction() {
    // A standard route must contain CRUDA
    this.app.post(
      this.prefix + "/transaction",
      [],
      this.transactionController.create.bind(this.transactionController)
    ); // Create
    this.app.get(
      this.prefix + "/transaction",
      [],
      this.transactionController.read.bind(this.transactionController)
    ); // Read
    this.app.patch(
      this.prefix + "/transaction/:id",
      [],
      this.transactionController.update.bind(this.transactionController)
    ); // Update
    this.app.delete(
      this.prefix + "/transaction/:id",
      [],
      this.transactionController.delete.bind(this.transactionController)
    ); // Delete
    this.app.get(
      this.prefix + "/transactions",
      [],
      this.transactionController.all.bind(this.transactionController)
    ); // All
  }
  warehouse() {
    // A standard route must contain CRUDA
    this.app.post(
      this.prefix + "/warehouse",
      [],
      this.warehouseController.create.bind(this.warehouseController)
    ); // Create
    this.app.get(
      this.prefix + "/warehouse",
      [],
      this.warehouseController.read.bind(this.warehouseController)
    ); // Read
    this.app.patch(
      this.prefix + "/warehouse/:id",
      [],
      this.warehouseController.update.bind(this.warehouseController)
    ); // Update
    this.app.delete(
      this.prefix + "/warehouse/:id",
      [],
      this.warehouseController.delete.bind(this.warehouseController)
    ); // Delete
    this.app.get(
      this.prefix + "/warehouses",
      [],
      this.warehouseController.all.bind(this.warehouseController)
    ); // All
  }
  account(){
    // A standard route must contain CRUDA
    this.app.post(
      this.prefix + "/account",
      [],
      this.accountController.create.bind(this.accountController)
    ); // Create
    this.app.get(
      this.prefix + "/account",
      [],
      this.accountController.read.bind(this.accountController)
    ); // Read
    this.app.patch(
      this.prefix + "/account/:id",
      [],
      this.accountController.update.bind(this.accountController)
    ); // Update
    this.app.delete(
      this.prefix + "/account/:id",
      [],
      this.accountController.delete.bind(this.accountController)
    ); // Delete
    this.app.get(
      this.prefix + "/accounts",
      [],
      this.accountController.all.bind(this.accountController)
    ); // All
  }
}
