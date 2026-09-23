export interface ContactFormData {
  name: string;
  email: string;
  message: string;
}

interface ApiErrorBody {
  error?: { code?: string; message?: string; fields?: Record<string, string> };
}

export class ContactApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly fields?: Record<string, string>,
  ) {
    super(message);
  }
}

export async function submitContact(data: ContactFormData, timeoutMs = 8_000): Promise<{ id: string; status: 'pending' }> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
  const baseUrl = import.meta.env.VITE_API_URL?.trim() || '/api';
  try {
    const response = await fetch(`${baseUrl}/contact`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(data),
      signal: controller.signal,
    });
    let body: ApiErrorBody & { success?: boolean; data?: { id: string; status: 'pending' } } = {};
    try { body = await response.json(); } catch { /* handled below */ }
    if (response.status !== 202 || !body.success || !body.data) {
      throw new ContactApiError(
        response.status,
        body.error?.code || 'UNKNOWN_ERROR',
        body.error?.message || `HTTP ${response.status}`,
        body.error?.fields,
      );
    }
    return body.data;
  } catch (error) {
    if (error instanceof ContactApiError) throw error;
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ContactApiError(0, 'REQUEST_TIMEOUT', 'REQUEST_TIMEOUT');
    }
    throw new ContactApiError(0, 'NETWORK_ERROR', 'NETWORK_ERROR');
  } finally {
    window.clearTimeout(timeout);
  }
}
