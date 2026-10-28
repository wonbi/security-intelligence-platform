/**
 * VirusTotal lookup proxy for GitHub Pages.
 * Configure Worker secret VT_API_KEY and variable ALLOWED_ORIGIN.
 * Supported: GET /api/health, GET /api/lookup?type=hash|domain|ip|url&value=...
 */
const VT_BASE = "https://www.virustotal.com/api/v3";
const MAX_VALUE_LENGTH = 2048;

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const allowedOrigin = env.ALLOWED_ORIGIN || "https://wonbi.github.io";
    const cors = {
      "Access-Control-Allow-Origin": allowedOrigin,
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Vary": "Origin",
    };

    if (origin && origin !== allowedOrigin) {
      return json({ error: "Origin not allowed" }, 403, cors);
    }
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }
    if (request.method !== "GET") {
      return json({ error: "Method not allowed" }, 405, cors);
    }
    if (!env.VT_API_KEY) {
      return json({ error: "VirusTotal API key is not configured on the server." }, 503, cors);
    }

    const url = new URL(request.url);
    if (url.pathname === "/api/health") {
      return json({ ok: true, provider: "VirusTotal" }, 200, cors);
    }
    if (url.pathname !== "/api/lookup") {
      return json({ error: "Not found" }, 404, cors);
    }

    const type = url.searchParams.get("type") || "";
    const value = (url.searchParams.get("value") || "").trim();
    if (!["hash", "domain", "ip", "url"].includes(type)) {
      return json({ error: "type must be hash, domain, ip, or url" }, 400, cors);
    }
    if (!value || value.length > MAX_VALUE_LENGTH || /[\u0000-\u001f\u007f]/.test(value)) {
      return json({ error: "Invalid indicator" }, 400, cors);
    }

    let path;
    if (type === "hash") {
      if (!/^(?:[a-fA-F0-9]{32}|[a-fA-F0-9]{40}|[a-fA-F0-9]{64})$/.test(value)) {
        return json({ error: "Enter a valid MD5, SHA-1, or SHA-256 hash." }, 400, cors);
      }
      path = "/files/" + encodeURIComponent(value);
    } else if (type === "ip") {
      if (!/^[0-9a-fA-F:.]+$/.test(value)) {
        return json({ error: "Enter a valid IPv4 or IPv6 address." }, 400, cors);
      }
      path = "/ip_addresses/" + encodeURIComponent(value);
    } else if (type === "domain") {
      if (value.length > 253 || !/^(?=.{1,253}$)(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,63}$/.test(value)) {
        return json({ error: "Enter a valid domain name." }, 400, cors);
      }
      path = "/domains/" + encodeURIComponent(value.toLowerCase());
    } else {
      let parsed;
      try { parsed = new URL(value); } catch { return json({ error: "Enter a complete http:// or https:// URL." }, 400, cors); }
      if (!["http:", "https:"].includes(parsed.protocol)) {
        return json({ error: "Only http:// and https:// URLs are supported." }, 400, cors);
      }
      const bytes = new TextEncoder().encode(value);\n      let binary = "";\n      bytes.forEach(byte => binary += String.fromCharCode(byte));\n      const id = btoa(binary).replace(/\\+/g, "-").replace(/\\//g, "_").replace(/=+$/g, "");
      path = "/urls/" + encodeURIComponent(id);
    }

    const upstream = await fetch(VT_BASE + path, {
      headers: { "x-apikey": env.VT_API_KEY, "accept": "application/json" },
    });
    const body = await upstream.text();
    return new Response(body, {
      status: upstream.status,
      headers: { ...cors, "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
    });
  },
};

function json(data, status, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...headers, "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });
}
