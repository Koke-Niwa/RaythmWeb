const ALLOWED_STATUSES = new Set(['received', 'reviewing', 'accepted', 'rejected']);

export const json = (data, status = 200, headers = {}) => Response.json(data, {
  status,
  headers: {
    'Cache-Control': 'no-store',
    ...headers
  }
});

export const normalizeText = (value, maxLength) => String(value ?? '').trim().slice(0, maxLength);

export const normalizeEmail = (value) => normalizeText(value, 254).toLowerCase();

export const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export const isValidUuid = (value) => /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

export const isValidAccessToken = (value) => /^[A-Za-z0-9_-]{43}$/.test(String(value || ''));

export const hashAccessToken = async (value) => {
  const bytes = new TextEncoder().encode(String(value || ''));
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
};

export const isAllowedStatus = (value) => ALLOWED_STATUSES.has(value);

export const validateSharedUrl = (value, label, required = true) => {
  const normalized = normalizeText(value, 2048);
  if (!normalized) return required ? `${label}の共有リンクを入力してください。` : null;
  try {
    const url = new URL(normalized);
    if (url.protocol !== 'https:' || url.username || url.password) {
      return `${label}にはHTTPSの共有リンクを入力してください。`;
    }
    return null;
  } catch {
    return `${label}の共有リンクが正しくありません。`;
  }
};

export const createReceiptId = () => {
  const bytes = crypto.getRandomValues(new Uint8Array(5));
  const token = Array.from(bytes, (byte) => byte.toString(36).padStart(2, '0')).join('').slice(0, 8).toUpperCase();
  const date = new Date().toISOString().slice(0, 10).replaceAll('-', '');
  return `RAY-${date}-${token}`;
};

export const verifyTurnstile = async ({ token, secret, ip, localDev }) => {
  if (localDev) return true;
  if (!secret || !token) return false;

  const body = new URLSearchParams({
    secret,
    response: token
  });
  if (ip) body.set('remoteip', ip);

  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body
    });
    if (!response.ok) return false;
    const result = await response.json();
    return result.success === true;
  } catch {
    return false;
  }
};

export const requireAdmin = (request, env) => {
  const expected = String(env.ADMIN_TOKEN || '');
  const authorization = request.headers.get('Authorization') || '';
  const actual = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  return expected.length >= 12 && actual === expected;
};
