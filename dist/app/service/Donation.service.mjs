import DBService from "./DB.service.mjs";

class DonationService {
  // initialization to ensure DB is ready
  async init() {
    await DBService.initialize();
    await DBService.create('donations');
  }

  // Insert a new donation record
  async insertDonation(donation) {
    return await DBService.insert('donations', donation);
  }

  // Update an existing donation by ID in a specific day
  async updateDonation(year, month, day, id, data) {
    return await DBService.update('donations', year, month, day, id, data);
  }

  // Get all day folders for donations in a specific month
  async getAllDaysInMonth(year, month) {
    return await DBService.all('donations', year, month);
  }

  // Get the path to a specific day's donations folder
  readDayFolder(year, month, day) {
    return DBService.read('donations', year, month, day);
  }

  // "Delete" the donations database (hide folder)
  async deleteDonations() {
    return await DBService.delete('donations');
  }
}

const donationService = new DonationService;
await donationService.init();
export default donationService;
