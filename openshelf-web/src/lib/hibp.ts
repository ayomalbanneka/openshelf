/**
 * Checks a password against the HaveIBeenPwned Pwned Passwords API
 * using the k-Anonymity model — only the first 5 chars of the SHA-1
 * hash are ever sent to the API. The full hash never leaves the browser.
 *
 * Returns true if the password has appeared in known breaches.
 */
export async function checkPwned(password: string): Promise<boolean> {
  try {
    // SHA-1 hash of the password
    const msgBuffer = new TextEncoder().encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-1', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase();

    const prefix = hashHex.slice(0, 5);
    const suffix = hashHex.slice(5);

    // HIBP returns all hashes starting with the prefix
    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: { 'Add-Padding': 'true' }, // prevents traffic analysis
    });

    if (!res.ok) return false; // fail open — don't block registration if API is down

    const text = await res.text();

    // Each line: "HASH_SUFFIX:COUNT"
    return text.split('\n').some((line) => line.split(':')[0] === suffix);
  } catch {
    return false; // fail open
  }
}
