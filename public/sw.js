self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", () => {
  console.log("Service worker activated");
});

// Detect internet restore
self.addEventListener("online", () => {
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({ type: "ONLINE" });
    });
  });
});
