// controllers/TransactionController.mjs — Updated for Celcium360 CBT Results (2025)
import AfroService from "../service/Afro.service.mjs";
import dotenv from "dotenv";
dotenv.config();

class TransactionController {
  constructor() {
    this.afroLetService = AfroService; // singleton instance
  }
}

export default new TransactionController();
