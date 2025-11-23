/**
 * OAuth 1.0 utilities for API authentication
 */

/**
 * RFC 3986 compliant percent encoding for OAuth 1.0
 * Encodes all characters except: A-Z a-z 0-9 - _ . ~
 */
export function percentEncode(value: string): string {
  return encodeURIComponent(value)
    .replace(/!/g, '%21')
    .replace(/\*/g, '%2A')
    .replace(/'/g, '%27')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29');
}

/**
 * Generate HMAC-SHA1 signature for OAuth 1.0
 */
export async function generateOAuthSignature(
  method: string,
  url: string,
  params: Record<string, string>,
  consumerSecret: string,
  tokenSecret: string = ''
): Promise<string> {
  // Sort parameters alphabetically
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${percentEncode(key)}=${percentEncode(params[key])}`)
    .join('&');

  // Create signature base string
  const signatureBaseString = [
    method.toUpperCase(),
    encodeURIComponent(url),
    encodeURIComponent(sortedParams)
  ].join('&');

  // Create signing key
  const signingKey = `${percentEncode(consumerSecret)}&${percentEncode(tokenSecret)}`;

  // Generate HMAC-SHA1 signature
  const encoder = new TextEncoder();
  const keyData = encoder.encode(signingKey);
  const messageData = encoder.encode(signatureBaseString);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
  
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

/**
 * Generate random nonce for OAuth requests
 */
export function generateNonce(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

/**
 * Generate timestamp for OAuth requests
 */
export function generateTimestamp(): string {
  return Math.floor(Date.now() / 1000).toString();
}

/**
 * Build complete OAuth 1.0 signed request URL
 */
export async function buildOAuth1Request(
  method: string,
  baseUrl: string,
  queryParams: Record<string, string>,
  consumerKey: string,
  consumerSecret: string
): Promise<string> {
  const oauthParams: Record<string, string> = {
    oauth_consumer_key: consumerKey,
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: generateTimestamp(),
    oauth_nonce: generateNonce(),
    oauth_version: '1.0',
    ...queryParams
  };

  const signature = await generateOAuthSignature(
    method,
    baseUrl,
    oauthParams,
    consumerSecret
  );

  oauthParams.oauth_signature = signature;

  const queryString = Object.keys(oauthParams)
    .sort()
    .map(key => `${percentEncode(key)}=${percentEncode(oauthParams[key])}`)
    .join('&');

  return `${baseUrl}?${queryString}`;
}
