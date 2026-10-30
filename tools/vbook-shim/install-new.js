// Như install.js nhưng cho app vbook mới trên CH Play: POST /extension/install, body giống phone-new.js (không có input).
//   node install-new.js <http://ip:port> <thư mục extension>
// Ví dụ: node install-new.js http://192.168.5.17:8090 ../../sachiepvien
const fs = require("fs");
const path = require("path");
const http = require("http");

const [,, appUrlArg, extArg] = process.argv;
if (!appUrlArg || !extArg) {
  console.error("Usage: node install-new.js <http://ip:port> <extension dir>");
  process.exit(1);
}
const extDir = path.resolve(extArg);
const srcDir = path.join(extDir, "src");

const src = {};
for (const f of fs.readdirSync(srcDir)) if (f.endsWith(".js") && !f.startsWith("_")) src[f] = fs.readFileSync(path.join(srcDir, f), "utf8");
const iconFile = path.join(extDir, "icon.png");
// App gỡ escape chuỗi plugin thêm một lần nên nhân đôi dấu \ (xem phone-new.js)
const plugin = fs.readFileSync(path.join(extDir, "plugin.json"), "utf8").replace(/\\/g, "\\\\");
const body = JSON.stringify({
  plugin,
  icon: fs.existsSync(iconFile) ? fs.readFileSync(iconFile).toString("base64") : "",
  src: JSON.stringify(src),
});

const req = http.request(new URL("/extension/install", appUrlArg), {
  method: "POST", headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) }, timeout: 60000,
}, res => {
  const chunks = [];
  res.on("data", c => chunks.push(c));
  res.on("end", () => console.log(res.statusCode, Buffer.concat(chunks).toString("utf8")));
});
req.on("timeout", () => { console.error("Timeout"); req.destroy(); });
req.on("error", e => console.error("Connection error:", e.message));
req.end(body);
