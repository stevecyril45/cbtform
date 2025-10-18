import dotenv from "dotenv";
dotenv.config();
export class MailTemplate {
  domain = process.env.DOMAIN;
  HQ = process.env.HQ;
  SERVER_URL = process.env.SERVER_URL;
  APP = process.env.APP_NAME;
  LOGO_URL = process.env.LOGO_URL;
  constructor() {}
  
}
