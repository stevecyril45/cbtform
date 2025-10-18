import DBService from "./DB.service.mjs";

class TransactionService {
  // initialization to ensure DB is ready
  async init() {
    await DBService.initialize();
    await DBService.create('transactions');
  }

  // Insert a new transaction record
  async insertTransaction(transaction) {
    return await DBService.insert('transactions', transaction);
  }

  // Update an existing transaction by ID in a specific day
  async updateTransaction(year, month, day, id, data) {
    return await DBService.update('transactions', year, month, day, id, data);
  }

  // Get all day folders for transactions in a specific month
  async getAllDaysInMonth(year, month) {
    return await DBService.all('transactions', year, month);
  }

  // Get the path to a specific day's transactions folder
  readDayFolder(year, month, day) {
    return DBService.read('transactions', year, month, day);
  }

  // "Delete" the transactions database (hide folder)
  async deleteTransactions() {
    return await DBService.delete('transactions');
  }
}



const transactionService = new TransactionService;
await transactionService.init();
export default transactionService;
