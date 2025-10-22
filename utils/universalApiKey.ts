/* ===================== Universal-key suffix decoding =======================
   Backend encodes "<host>:<port>" as:
     token = "v1" + Base32( bytes(host:port) XOR 0x5A ), without '=' padding
   We decode it, then build "http://<host>:<port>" (IPv6 hosts get brackets).
============================================================================= */

/** RFC4648 Base32 decode (no padding required). Throws on bad chars. */
function base32DecodeNoPadding(s: string): Uint8Array {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const clean = s.trim().toUpperCase().replace(/=+$/g, "");
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    const idx = alphabet.indexOf(ch);
    if (idx === -1) throw new Error("Invalid Base32 character");
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      out.push((value >>> bits) & 0xff);
    }
  }
  return new Uint8Array(out);
}

/** Convert "host:port" → "http://host:port" with IPv6 bracket handling */
function hostPortToHttpBase(hostPort: string): string {
  // Split at last ":" to separate port; IPv6 contains multiple ":"s.
  const last = hostPort.lastIndexOf(":");
  let host = hostPort;
  let port = "";
  if (last !== -1) {
    host = hostPort.slice(0, last);
    port = hostPort.slice(last + 1);
  }
  const isIPv6 = host.includes(":");
  const bracketHost = isIPv6 ? `[${host}]` : host;
  const portPart = port ? `:${port}` : "";
  return `http://${bracketHost}${portPart}`;
}

/** Decode middleware base URL from the composite universal key (or return null). */
export function decodeMiddlewareBaseFromUniversalKey(
  universalApiKey: string | undefined | null,
): string | null {
  const raw = (universalApiKey || "").trim();
  const hash = raw.indexOf("#");
  if (hash < 0) return null;
  const suffix = raw.slice(hash + 1);

  // Backward compatibility: accept raw http(s) suffixes if they ever existed.
  if (/^https?:\/\/.+/i.test(suffix)) {
    return suffix.replace(/\/+$/g, "");
  }

  // Expected scheme: 'v1' + Base32(no padding) of XOR'd bytes
  if (!suffix.startsWith("v1")) return null;
  try {
    const b32 = suffix.slice(2);
    const bytes = base32DecodeNoPadding(b32);
    // XOR with 0x5A to recover original "host:port" ascii
    for (let i = 0; i < bytes.length; i++) bytes[i] = bytes[i] ^ 0x5a;
    const hostPort = new TextDecoder().decode(bytes);
    if (!hostPort || hostPort.indexOf(":") === -1) return null;
    return hostPortToHttpBase(hostPort).replace(/\/+$/g, "");
  } catch {
    return null;
  }
}
