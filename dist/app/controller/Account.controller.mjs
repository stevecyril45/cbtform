import accountService from "../service/Account.service.mjs";
import dotenv from "dotenv";
dotenv.config();

const MAX_RECORDS_PER_FILE = process.env.MAX_RECORDS_PER_FILE; // Configurable maximum records per file

class AccountController {
  // To Create, request must contain an array of accounts[] which must be up to 5% of MAX_RECORDS_PER_FILE
  // then insert the 50 files to the db using try and catch.
  // keep record of the added files with id and the unsuccessful ones without id and return response
  async create(req, res) {
    const { accounts } = req.body;
    if (!Array.isArray(accounts) || accounts.length === 0 || accounts.length > (MAX_RECORDS_PER_FILE * 0.05)) {
      return res.status(400).json({ error: 'Invalid input: accounts must be a non-empty array with max 50 items' });
    }

    const successful = [];
    const failed = [];

    for (const account of accounts) {
      try {
        const result = await accountService.insertAccount(account);
        if (result.success) {
          successful.push({ ...account, id: result.id || account.id });
        } else {
          failed.push({ ...account, errors: result.errors || ['Unknown error'] });
        }
      } catch (err) {
        failed.push({ ...account, errors: [err.message] });
      }
    }

    res.status(successful.length > 0 ? 201 : 207).json({
      message: `Processed ${successful.length} successful inserts out of ${accounts.length}`,
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

      const folderPath = accountService.readDayFolder(y, m, d);
      res.json({ folderPath, year: y, month: m, day: d });
    } catch (err) {
      res.status(500).json({ error: 'Internal server error', details: err.message });
    }
  }

  // similar to create must be up to 5% then attempt update
  async update(req, res) {
    const { accounts } = req.body; // Expect array of { year, month, day, id, data }
    if (!Array.isArray(accounts) || accounts.length === 0 || accounts.length > (MAX_RECORDS_PER_FILE * 0.05)) {
      return res.status(400).json({ error: 'Invalid input: accounts must be a non-empty array with max 50 items' });
    }

    const successful = [];
    const failed = [];

    for (const item of accounts) {
      const { year, month, day, id, data } = item;
      if (!year || !month || !day || !id || !data) {
        failed.push({ id, errors: ['Missing required fields: year, month, day, id, data'] });
        continue;
      }

      try {
        const result = await accountService.updateAccount(year, month, day, id, data);
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
      message: `Processed ${successful.length} successful updates out of ${accounts.length}`,
      successful,
      failed
    });
  }

  // this is similar to update must be up to 5% then set the status=deleted and update their record to return
  async delete(req, res) {
    const { accounts } = req.body; // Expect array of { year, month, day, id }
    if (!Array.isArray(accounts) || accounts.length === 0 || accounts.length > (MAX_RECORDS_PER_FILE * 0.05)) {
      return res.status(400).json({ error: 'Invalid input: accounts must be a non-empty array with max 50 items' });
    }

    const successful = [];
    const failed = [];

    for (const item of accounts) {
      const { year, month, day, id } = item;
      if (!year || !month || !day || !id) {
        failed.push({ id, errors: ['Missing required fields: year, month, day, id'] });
        continue;
      }

      try {
        const deletedData = { ...item, status: 'deleted' }; // Assume basic structure
        const result = await accountService.updateAccount(year, month, day, id, deletedData);
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
      message: `Processed ${successful.length} successful deletes out of ${accounts.length}`,
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
      console.log('here')
      const days = await accountService.getAllDaysInMonth(year, month);
      res.json({ year, month, days });
    } catch (err) {
      res.status(500).json({ error: 'Internal server error', details: err.message });
    }
  }
}

export default new AccountController();
