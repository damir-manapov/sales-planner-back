import { BaseClient } from './base-client.js';

export class ImportExportBaseClient extends BaseClient {
  protected async uploadCsv<T>(
    path: string,
    csvContent: string,
    params: Record<string, string | number | undefined>,
  ): Promise<T> {
    const url = new URL(this.baseUrl + path);

    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    }

    const formData = new FormData();
    const blob = new Blob([csvContent], { type: 'text/csv' });
    formData.append('file', blob, 'upload.csv');

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'X-API-Key': this.apiKey,
      },
      body: formData,
    });

    if (!response.ok) {
      await this.handleErrorResponse(response);
    }

    return response.json();
  }

  protected async requestPublic<T>(method: string, path: string): Promise<T> {
    const url = new URL(this.baseUrl + path);

    const response = await fetch(url.toString(), {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      await this.handleErrorResponse(response);
    }

    return response.json();
  }

  protected async requestTextPublic(method: string, path: string): Promise<string> {
    const url = new URL(this.baseUrl + path);

    const response = await fetch(url.toString(), { method });

    if (!response.ok) {
      await this.handleErrorResponse(response);
    }

    return response.text();
  }
}
