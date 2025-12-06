import fetch from 'node-fetch';
import https from 'https';
import fs from 'fs';
import path from 'path';

class HttpService {
  constructor() {
    if (HttpService.instance) {
      return HttpService.instance;
    }
    HttpService.instance = this;

    // SSL setup: Prefer NODE_EXTRA_CA_CERTS, fallback to SSL_DIR
    let caBuffer = null;
    const extraCaPath = process.env.NODE_EXTRA_CA_CERTS;
    if (extraCaPath && fs.existsSync(extraCaPath)) {
      try {
        caBuffer = fs.readFileSync(extraCaPath);
        console.log(`🔒 HttpService: Loaded CA from NODE_EXTRA_CA_CERTS: ${extraCaPath}`);
      } catch (err) {
        console.error('Failed to load NODE_EXTRA_CA_CERTS:', err.message);
      }
    }
    if (!caBuffer) {
      this.sslDir = process.env.SSL_DIR ? path.resolve(process.env.SSL_DIR) : path.join(process.cwd(), 'ssl');
      const certPath = path.join(this.sslDir, 'localhost+ip.crt');
      if (fs.existsSync(certPath)) {
        try {
          caBuffer = fs.readFileSync(certPath);
          console.log(`🔒 HttpService: Loaded cert from ${certPath} (fallback)`);
        } catch (loadErr) {
          console.error('Cert load failed:', loadErr.message);
        }
      }
    }

    // For node-fetch v2: Create https.Agent
    const tlsConfig = {
      ...(caBuffer && { ca: caBuffer }),
      rejectUnauthorized: false // Fallback to accept self-signed
    };
    this.agent = new https.Agent(tlsConfig);
    console.log('HttpService: Configured https.Agent with TLS (node-fetch v2)');
  }

  async post(url = '', body = null, options = {}) {
    console.log('HttpService.post: Requesting', url);
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...options.headers },
        body: body ? JSON.stringify(body) : null,
        agent: this.agent, // Use custom agent for TLS (v2)
        ...options,
      });
      console.log('HttpService.post: Response status', response.status);
      return await this.handleResponse(response);
    } catch (error) {
      console.error('HttpService.post error details:', error);
      return this.handleError(error);
    }
  }

  async patch(url = '', body = null, options = {}) {
    console.log('HttpService.patch: Requesting', url);
    try {
      const response = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...options.headers },
        body: body ? JSON.stringify(body) : null,
        agent: this.agent, // Use custom agent for TLS
        ...options,
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error('HttpService.patch error details:', error);
      return this.handleError(error);
    }
  }

  async put(url = '', body = null, options = {}) {
    console.log('HttpService.put: Requesting', url);
    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...options.headers },
        body: body ? JSON.stringify(body) : null,
        agent: this.agent, // Use custom agent for TLS
        ...options,
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error('HttpService.put error details:', error);
      return this.handleError(error);
    }
  }

  async get(url = '', options = {}) {
    console.log('HttpService.get: Requesting', url);
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', ...options.headers },
        agent: this.agent, // Use custom agent for TLS
        ...options,
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error('HttpService.get error details:', error);
      return this.handleError(error);
    }
  }

  async delete(url = '', options = {}) {
    console.log('HttpService.delete: Requesting', url);
    try {
      const response = await fetch(url, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', ...options.headers },
        agent: this.agent, // Use custom agent for TLS
        ...options,
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error('HttpService.delete error details:', error);
      return this.handleError(error);
    }
  }

  async handleResponse(response) {
    let data;
    try {
      data = await response.json();
    } catch (jsonErr) {
      data = await response.text(); // Fallback to text if not JSON
    }
    if (!response.ok) {
      throw new Error(data.message || data || `HTTP error! status: ${response.status}`);
    }
    return { success: true, data };
  }

  handleError(error) {
    return { success: false, error: error.message || 'An error occurred' };
  }
}

// Export a single instance
const httpService = new HttpService();
export default httpService;