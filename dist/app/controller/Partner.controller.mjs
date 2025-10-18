import partnerService from "../service/Partner.service.mjs";
import dotenv from "dotenv";
dotenv.config();


const MAX_RECORDS_PER_FILE = process.env.MAX_RECORDS_PER_FILE; // Configurable maximum records per file

class PartnerController {
  // To Create, request must contain an array of partners[] which must be up to 5% of MAX_RECORDS_PER_FILE
  // then insert the 50 files to the db using try and catch.
  // keep record of the added files with id and the unsuccessful ones without id and return response
  async create(req, res) {
    const { partners } = req.body;
    if (!Array.isArray(partners) || partners.length === 0 || partners.length > (MAX_RECORDS_PER_FILE * 0.05)) {
      return res.status(400).json({ error: 'Invalid input: partners must be a non-empty array with max 50 items' });
    }

    const successful = [];
    const failed = [];

    for (const partner of partners) {
      try {
        const result = await partnerService.insertPartner(partner);
        if (result.success) {
          successful.push({ ...partner, id: result.id || partner.id });
        } else {
          failed.push({ ...partner, errors: result.errors || ['Unknown error'] });
        }
      } catch (err) {
        failed.push({ ...partner, errors: [err.message] });
      }
    }

    res.status(successful.length > 0 ? 201 : 207).json({
      message: `Processed ${successful.length} successful inserts out of ${partners.length}`,
      successful,
      failed
    });
  }

  // to read, its purpose is to consume readDayFolder needing year month and day: by default use today if none is passed
  async read(req, res) {
    try {
      const { year, month, day } = req.query;
      const today = new Date();
      const defaultYear = today.getFullYear().toString();
      const defaultMonth = String(today.getMonth() + 1).padStart(2, '0');
      const defaultDay = String(today.getDate()).padStart(2, '0');

      const y = year || defaultYear;
      const m = month || defaultMonth;
      const d = day || defaultDay;

      const folderPath = partnerService.readDayFolder(y, m, d);
      res.json({ folderPath, year: y, month: m, day: d });
    } catch (err) {
      res.status(500).json({ error: 'Internal server error', details: err.message });
    }
  }

  // similar to create must be up to 5% then attempt update
  async update(req, res) {
    const { partners } = req.body; // Expect array of { year, month, day, id, data }
    if (!Array.isArray(partners) || partners.length === 0 || partners.length > (MAX_RECORDS_PER_FILE * 0.05)) {
      return res.status(400).json({ error: 'Invalid input: partners must be a non-empty array with max 50 items' });
    }

    const successful = [];
    const failed = [];

    for (const item of partners) {
      const { year, month, day, id, data } = item;
      if (!year || !month || !day || !id || !data) {
        failed.push({ id, errors: ['Missing required fields: year, month, day, id, data'] });
        continue;
      }

      try {
        const result = await partnerService.updatePartner(year, month, day, id, data);
        if (result) {
          successful.push({ id, updated: true });
        } else {
          failed.push({ id, errors: ['Record not found or update failed'] });
        }
      } catch (err) {
        failed.push({ id, errors: [err.message] });
      }
    }

    res.status(successful.length > 0 ? 200 : 207).json({
      message: `Processed ${successful.length} successful updates out of ${partners.length}`,
      successful,
      failed
    });
  }

  // this is similar to update must be up to 5% then set the status=deleted and update their record to return
  async delete(req, res) {
    const { partners } = req.body; // Expect array of { year, month, day, id }
    if (!Array.isArray(partners) || partners.length === 0 || partners.length > (MAX_RECORDS_PER_FILE * 0.05)) {
      return res.status(400).json({ error: 'Invalid input: partners must be a non-empty array with max 50 items' });
    }

    const successful = [];
    const failed = [];

    for (const item of partners) {
      const { year, month, day, id } = item;
      if (!year || !month || !day || !id) {
        failed.push({ id, errors: ['Missing required fields: year, month, day, id'] });
        continue;
      }

      try {
        const deletedData = { ...item, status: 'deleted' }; // Assume basic structure
        const result = await partnerService.updatePartner(year, month, day, id, deletedData);
        if (result) {
          successful.push({ id, deleted: true });
        } else {
          failed.push({ id, errors: ['Record not found or delete failed'] });
        }
      } catch (err) {
        failed.push({ id, errors: [err.message] });
      }
    }

    res.status(successful.length > 0 ? 200 : 207).json({
      message: `Processed ${successful.length} successful deletes out of ${partners.length}`,
      successful,
      failed
    });
  }

  // this is like read but use getAllDaysInMonth
  async all(req, res) {
    try {
      const { year, month } = req.query;
      if (!year || !month) {
        return res.status(400).json({ error: 'Missing required params: year, month' });
      }

      const days = await partnerService.getAllDaysInMonth(year, month);
      res.json({ year, month, days });
    } catch (err) {
      res.status(500).json({ error: 'Internal server error', details: err.message });
    }
  }
}

export default new PartnerController();
