import AccountController from "./Account.controller.mjs";
import CardController from "./Card.controller.mjs";
import DonationController from "./Donation.controller.mjs";
import PartnerController from "./Partner.controller.mjs";
import TransactionController from "./Transaction.controller.mjs";
import WarehouseController from "./Warehouse.controller.mjs";

export const controllers=  {
  card: CardController,
  donation: DonationController,
  partner: PartnerController,
  transaction: TransactionController,
  warehouse: WarehouseController,
  account: AccountController
};
