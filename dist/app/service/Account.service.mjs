import DBService from "./DB.service.mjs";

class AccountService {
  // initialization to ensure DB is ready
  async init() {
    await DBService.initialize();
    await DBService.create('accounts');
  }

  // Insert a new account record
  async insertAccount(account) {
    return await DBService.insert('accounts', account);
  }

  // Update an existing account by ID in a specific day
  async updateAccount(year, month, day, id, data) {
    return await DBService.update('accounts', year, month, day, id, data);
  }

  // Get all day folders for accounts in a specific month
  async getAllDaysInMonth(year, month) {
    return await DBService.all('accounts', year, month);
  }

  // Get the path to a specific day's accounts folder
  readDayFolder(year, month, day) {
    return DBService.read('accounts', year, month, day);
  }

  // "Delete" the accounts database (hide folder)
  async deleteAccounts() {
    return await DBService.delete('accounts');
  }
}

const accountService = new AccountService();

await accountService.init();
export default accountService;
