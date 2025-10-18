import fetch from 'node-fetch';

class HttpService {
  constructor() {
    if (HttpService.instance) {
      return HttpService.instance;
    }
    HttpService.instance = this;
  }

  async post(url = '', body = null, options = {}) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...options.headers },
        body: body ? JSON.stringify(body) : null,
        ...options,
      });
      return await this.handleResponse(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async patch(url = '', body = null, options = {}) {
    try {
      const response = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...options.headers },
        body: body ? JSON.stringify(body) : null,
        ...options,
      });
      return await this.handleResponse(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async put(url = '', body = null, options = {}) {
    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...options.headers },
        body: body ? JSON.stringify(body) : null,
        ...options,
      });
      return await this.handleResponse(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async get(url = '', options = {}) {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', ...options.headers },
        ...options,
      });
      return await this.handleResponse(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async delete(url = '', options = {}) {
    try {
      const response = await fetch(url, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', ...options.headers },
        ...options,
      });
      return await this.handleResponse(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async handleResponse(response) {
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
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
