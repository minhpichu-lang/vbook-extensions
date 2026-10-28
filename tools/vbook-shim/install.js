// Cài extension vào app vbook qua chế độ nhà phát triển (giống lệnh "Install" của vbook-extension-maker).
//   node install.js <http://ip:port> <thư mục extension>
// Ví dụ: node install.js http://192.168.100.227:8080 ../../vinahentai
const fs = require("fs");
const path = require("path");
const net = require("net");

const [,, appUrlArg, extArg] = process.argv;
if (!appUrlArg || !extArg) {
  console.error("Usage: node install.js <http://ip:port> <extension dir>");
  process.exit(1);
}
const extDir = path.resolve(extArg);
const plugin = JSON.parse(fs.readFileSync(path.join(extDir, "plugin.json"), "utf8"));
const data = { ...plugin.metadata, ...plugin.script };
data.id = "debug-" + plugin.metadata.source;
data.icon = "data:image/*;base64," + fs.readFileSync(path.join(extDir, "icon.png")).toString("base64");
data.enabled = true;
data.debug = true;
const scripts = {};
for (const f of fs.readdirSync(path.join(extDir, "src")).filter(f => f.endsWith(".js"))) {
  scripts[f] = fs.readFileSync(path.join(extDir, "src", f), "utf8");
}
data.data = JSON.stringify(scripts);

// App trả lời HTTP ngắt dòng bằng LF thay vì CRLF nên module http của Node parse lỗi -> dùng socket thô.
const u = new URL(appUrlArg);
const request = ["GET /install HTTP/1.1", `Host: ${u.hostname}`, "Connection: close",
  `data: ${Buffer.from(JSON.stringify(data)).toString("base64")}`, "", ""].join("\r\n");
let reply = "";
const client = net.createConnection({ host: u.hostname, port: Number(u.port) }, () => client.write(request));
client.on("data", c => reply += c);
client.on("error", e => console.error("Connection error:", e.message));
client.on("end", () => {
  const body = reply.split(/\r?\n\r?\n/)[1] || "";
  console.log(body.trim() === '{"status":0}' ? "Đã cài: " + Object.keys(scripts).join(", ") : "Phản hồi: " + reply);
});
