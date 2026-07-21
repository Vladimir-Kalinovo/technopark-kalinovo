import { getStore } from "@netlify/blobs";

// GET  — вернуть массив объектов из облака (или null, если ещё не сохраняли).
// POST — сохранить массив объектов (нужен токен = переменная ADMIN_TOKEN).
export default async (req) => {
  const store = getStore("site-data");

  if (req.method === "GET") {
    try {
      const data = await store.get("objects", { type: "json" });
      return json(data ?? null);
    } catch (e) {
      return json(null);
    }
  }

  if (req.method === "POST") {
    const auth = req.headers.get("authorization") || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    const expected = process.env.ADMIN_TOKEN || "";
    if (!expected || token !== expected) {
      return new Response("Unauthorized", { status: 401 });
    }
    let body;
    try {
      body = await req.json();
    } catch (e) {
      return new Response("Bad JSON", { status: 400 });
    }
    if (!Array.isArray(body) || body.length === 0) {
      return new Response("Expected non-empty array", { status: 400 });
    }
    await store.setJSON("objects", body);
    return json({ ok: true, count: body.length });
  }

  return new Response("Method not allowed", { status: 405 });
};

function json(obj) {
  return new Response(JSON.stringify(obj), {
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}
