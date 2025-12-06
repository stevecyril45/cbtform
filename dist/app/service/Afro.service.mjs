import dotenv from "dotenv";

dotenv.config();

class AfroService {
  constructor() {
    this._banner("AFRO SERVICE INITIALIZED");
  }
  _banner(message) {
    const c = {
      g: "\x1b[32m",
      c: "\x1b[36m",
      y: "\x1b[33m",
      r: "\x1b[0m",
    };

    console.log(`
${c.g}╔══════════════════════════════════════════════════════════════╗
${c.g}║                    AFROGIFT TEMPLATE SERVICE                    ${c.g}║
${c.g}╠══════════════════════════════════════════════════════════════╣
${c.g}║  Status     : ${c.c}${message.padEnd(48)}${c.g}║
${c.g}║  Time       : ${c.c}${new Date().toLocaleString()}${c.g}                  ║
${c.g}╚══════════════════════════════════════════════════════════════╝${c.r}
    `);
  }
}

// Export single shared instance
export default new AfroService();
