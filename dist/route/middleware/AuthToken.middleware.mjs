import { EncryptionService } from "../../app/service/Encryption.service.mjs";
import HttpService from "../../app/service/Http.service.mjs";
import dotenv from "dotenv";
dotenv.config();

export default function authTokenMiddleware(req, res, next) {
  const API = process.env.AUTH_DOMAIN + "/api/transaction";

  const contract = req.headers["c"];
  const ip = req.headers["ip"];
  if (!contract) {
    return res.status(401).json({ error: "It needs a contract" });
  }
  if (!ip) {
    return res.status(401).json({ error: "It needs a IP" });
  }

  const httpService = HttpService;
  httpService
    .get(`${API}?contract=${contract}`, {
      headers: {
        "Content-Type": "application/json",
      },
    })
    .then((res) => {
      const result = res.data;
      if (!res.success) {
        return res.status(500).json({ error: "Verification service error" });
      }
      if (!result.data.c) {
        return res.status(401).json({ error: "Invalid contract" });
      }
      req.auth = {ip,address:result.data.a, ...result.data};
      next();
    })
    .catch((err) => {
      res
        .status(500)
        .json({ error: "Internal server error", details: err.message });
    });
}
