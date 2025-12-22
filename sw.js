// sw.js
const CACHE_NAME = "peptide-mw-cache-v1";

// 必要なファイルをキャッシュ対象に入れる
// ※ start_url を "./" にしてるなら "./" と "./index.html" 両方あると安心
const ASSETS_TO_CACHE = [
  "./",
  "./index.html",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-512-maskable.png"
];

// インストール時：必要ファイルをキャッシュ
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

// 有効化時：古いキャッシュ削除
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// 取得時：基本は「キャッシュ優先」
// - キャッシュがあればそれを返す
// - なければネットへ取りに行って成功したらキャッシュして返す
self.addEventListener("fetch", (event) => {
  const req = event.request;

  // GET 以外は触らん（安全）
  if (req.method !== "GET") return;

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;

      return fetch(req)
        .then((res) => {
          // 失敗や opaque はそのまま返す
          if (!res || res.status !== 200) return res;

          // 取得できたものはキャッシュに積む
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
          return res;
        })
        .catch(() => {
          // ネットもダメでキャッシュも無い場合のフォールバック
          // 画面（ナビゲーション）ならトップを返す
          if (req.mode === "navigate") return caches.match("./");
          return new Response("Offline", { status: 503, statusText: "Offline" });
        });
    })
  );
});
