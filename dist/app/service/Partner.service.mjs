import DBService from "./DB.service.mjs";

class PartnerService {
  // initialization to ensure DB is ready
  async init() {
    await DBService.initialize();
    await DBService.create('partners');
  }

  // Insert a new partner record
  async insertPartner(partner) {
    return await DBService.insert('partners', partner);
  }

  // Update an existing partner by ID in a specific day
  async updatePartner(year, month, day, id, data) {
    return await DBService.update('partners', year, month, day, id, data);
  }

  // Get all day folders for partners in a specific month
  async getAllDaysInMonth(year, month) {
    return await DBService.all('partners', year, month);
  }

  // Get the path to a specific day's partners folder
  readDayFolder(year, month, day) {
    return DBService.read('partners', year, month, day);
  }

  // "Delete" the partners database (hide folder)
  async deletePartners() {
    return await DBService.delete('partners');
  }
}


const partnerService = new PartnerService;
await partnerService.init();
export default partnerService;
