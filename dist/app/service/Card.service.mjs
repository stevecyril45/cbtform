import DBService from "./DB.service.mjs";

class CardService {
  // initialization to ensure DB is ready
  async init() {
    await DBService.initialize();
    await DBService.create('cards');
  }

  // Insert a new card record
  async insertCard(card) {
    return await DBService.insert('cards', card);
  }

  // Update an existing card by ID in a specific day
  async updateCard(year, month, day, id, data) {
    return await DBService.update('cards', year, month, day, id, data);
  }

  // Get all day folders for cards in a specific month
  async getAllDaysInMonth(year, month) {
    return await DBService.all('cards', year, month);
  }

  // Get the path to a specific day's cards folder
  readDayFolder(year, month, day) {
    return DBService.read('cards', year, month, day);
  }

  // "Delete" the cards database (hide folder)
  async deleteCards() {
    return await DBService.delete('cards');
  }
}

const cardService = new CardService();

await cardService.init();
export default cardService;
