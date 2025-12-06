import dotenv from "dotenv";
dotenv.config();
export class MailTemplate {
  SERVER_URL = process.env.SERVER_URL;
  APP = process.env.SERVER_NAME;
  constructor() {}
}
