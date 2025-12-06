import { EncryptionService } from "../../app/service/Encryption.service.mjs";

import dotenv from "dotenv";
dotenv.config();
const encryptionService = new EncryptionService();

export default function decryptRequestMiddleware(req, res, next) {
  // To decrypt a request, you need to ensure the header contain the following:
  // 1. origin
  // 2. app address
  // 3. requestedAt


  const origin = req.headers["origin"];
  const appAddress = req.headers["appaddress"];
  const requestedAtStr = req.headers["requestedat"];
  const accept = req.headers["accept"];
  console.log(!origin || !appAddress || !requestedAtStr || !accept);

  // Skip decryption if required headers are missing (not a valid Afro request)
  if (!origin || !appAddress || !requestedAtStr || !accept) {
    return res.status(400).json({ error: "Invalid Afro Request" });
  }

  // Generate the request key same as client
  const requestKey = `${appAddress}${requestedAtStr}${accept}${origin}`;
  console.log(requestKey);
  // Parse requestedAt timestamp (assuming it's in milliseconds as a string)
  const requestedAt = parseInt(requestedAtStr, 10);
  if (isNaN(requestedAt)) {
    return res.status(400).json({ error: "Invalid requestedAt timestamp" });
  }

  // Check time overlap: no longer than 60 seconds
  const currentTime = Date.now();
  const timeDiff = Math.abs(currentTime - requestedAt);
  if (timeDiff > 60000) {
    return res.status(408).json({ error: "Network timeout" });
  }

  // Attempt to decrypt the request body (assuming it's encrypted JSON string)
  try {
    if (!req.body || !req.body.data) {
      return res.status(400).json({ error: "Invalid encrypted body" });
    }
    let decrypted = encryptionService.decryptSha256UsingKey(
      requestKey,
      req.body.data
    );
    // Assuming decrypted is a JSON string, parse it
    // Optional: Strip BOM if still suspected elsewhere (harmless)
    decrypted = decrypted.replace(/\uFEFF/g, "");
    let jsonString;
    if(!decrypted || !decrypted.email){
      // First parse: Unwrap the outer JSON string literal
      jsonString = JSON.parse(decrypted);
    }
    if(!jsonString || !jsonString.email){
      // Second parse: Convert the inner JSON string to object
      req.body = JSON.parse(jsonString);
    }else{
      req.body = jsonString;
    }
  } catch (error) {
    console.log(error);
    return res.status(401).json({ error: "Decryption failed" });
  }

  // Proceed to next middleware with decrypted body
  next();
}
