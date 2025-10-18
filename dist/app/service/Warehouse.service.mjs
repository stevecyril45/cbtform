import DBService from "./DB.service.mjs";

class WarehouseService {
  // initialization to ensure DB is ready
  async init() {
    await DBService.initialize();
    await DBService.create('warehouse');
  }

  // Insert a new warehouse record
  async insertWarehouse(warehouse) {
    return await DBService.insert('warehouse', warehouse);
  }

  // Update an existing warehouse by ID in a specific day
  async updateWarehouse(year, month, day, id, data) {
    return await DBService.update('warehouse', year, month, day, id, data);
  }

  // Get all day folders for warehouses in a specific month
  async getAllDaysInMonth(year, month) {
    return await DBService.all('warehouse', year, month);
  }

  // Get the path to a specific day's warehouse folder
  readDayFolder(year, month, day) {
    return DBService.read('warehouse', year, month, day);
  }

  // "Delete" the warehouse database (hide folder)
  async deleteWarehouse() {
    return await DBService.delete('warehouse');
  }
}


const warehouseService = new WarehouseService;
await warehouseService.init();
export default warehouseService;
