// Như phone.js nhưng cho app vbook mới trên CH Play (com.vbook.android): bật ở Cài đặt → Dịch vụ web →
// Chế độ nhà phát triển (cổng mặc định 8080, đổi được). App mới nhận cả extension trong một POST JSON
// tới /extension/test: { plugin: <plugin.json>, icon: <base64>, src: JSON {tên file: nội dung}, input: JSON {script, vararg} }.
// Không cần server phục vụ load() vì mọi file src/ đã gửi kèm.
//   node phone-new.js <http://ip:port> <đường dẫn script> [tham số 1] [tham số 2]...
// Ví dụ: node phone-new.js http://192.168.5.17:8090 ../../hentaivnx/src/detail.js https://hentaivnx.live/truyen-hentai/abc-123
const fs = require("fs");
const path = require("path");
const http = require("http");

const [,, appUrlArg, scriptArg, ...inputs] = process.argv;
if (!appUrlArg || !scriptArg) {
  console.error("Usage: node phone-new.js <http://ip:port> <script.js> [param...]");
  process.exit(1);
}
const scriptPath = path.resolve(scriptArg);
const srcDir = path.dirname(scriptPath);
const extDir = path.dirname(srcDir);

const src = {};
for (const f of fs.readdirSync(srcDir)) if (f.endsWith(".js")) src[f] = fs.readFileSync(path.join(srcDir, f), "utf8");
const iconFile = path.join(extDir, "icon.png");
// App gỡ escape chuỗi plugin thêm một lần ("\\." trong regexp thành "\." → JSON lỗi) nên nhân đôi dấu \
const plugin = fs.readFileSync(path.join(extDir, "plugin.json"), "utf8").replace(/\\/g, "\\\\");
const body = JSON.stringify({
  plugin,
  icon: fs.existsSync(iconFile) ? fs.readFileSync(iconFile).toString("base64") : "",
  src: JSON.stringify(src),
  input: JSON.stringify({ script: path.basename(scriptPath), vararg: inputs }),
});

const req = http.request(new URL("/extension/test", appUrlArg), {
  method: "POST", headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) }, timeout: 180000,
}, res => {
  const chunks = [];
  res.on("data", c => chunks.push(c));
  res.on("end", () => {
    const raw = Buffer.concat(chunks).toString("utf8");
    try { console.log(JSON.stringify(JSON.parse(raw), null, 2)); } catch { console.log(raw); }
  });
});
req.on("timeout", () => { console.error("Timeout"); req.destroy(); });
req.on("error", e => console.error("Connection error:", e.message));
req.end(body);
