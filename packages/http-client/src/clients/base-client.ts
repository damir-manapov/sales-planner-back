export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface ClientConfig {
  baseUrl: string;
  apiKey: string;
}

export class BaseClient {
  protected baseUrl: string;
  protected apiKey: string;

  constructor(config: ClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.apiKey = config.apiKey;
  }

  protected async handleErrorResponse(response: Response): Promise<never> {
    const text = await response.text();
    let message = response.statusText;
    if (text) {
      try {
        const error = JSON.parse(text);
        message = error.message || message;
      } catch {
        message = text;
      }
    }
    throw new ApiError(response.status, message || 'Request failed');
  }

  protected async request<T>(
    method: string,
    path: string,
    options?: {
      body?: unknown;
      params?: Record<string, string | number | number[] | undefined>;
    },
  ): Promise<T> {
    const url = new URL(this.baseUrl + path);

    if (options?.params) {
      for (const [key, value] of Object.entries(options.params)) {
        if (value !== undefined) {
          // Convert arrays to comma-separated strings
          const stringValue = Array.isArray(value) ? value.join(',') : String(value);
          url.searchParams.set(key, stringValue);
        }
      }
    }

    const response = await fetch(url.toString(), {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey,
      },
      body: options?.body ? JSON.stringify(options.body) : undefined,
    });

    if (!response.ok) {
      await this.handleErrorResponse(response);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    // Handle empty response body (e.g., void return type from NestJS)
    const text = await response.text();
    if (!text) {
      return undefined as T;
    }

    return JSON.parse(text);
  }

  protected async requestText(
    method: string,
    path: string,
    options?: {
      params?: Record<string, string | number | number[] | undefined>;
    },
  ): Promise<string> {
    const url = new URL(this.baseUrl + path);

    if (options?.params) {
      for (const [key, value] of Object.entries(options.params)) {
        if (value !== undefined) {
          // Convert arrays to comma-separated strings
          const stringValue = Array.isArray(value) ? value.join(',') : String(value);
          url.searchParams.set(key, stringValue);
        }
      }
    }

    const response = await fetch(url.toString(), {
      method,
      headers: {
        'X-API-Key': this.apiKey,
      },
    });

    if (!response.ok) {
      await this.handleErrorResponse(response);
    }

    return response.text();
  }
}
