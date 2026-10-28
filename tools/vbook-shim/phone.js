// Chạy script vbook trực tiếp trên điện thoại qua chế độ nhà phát triển (không cần VS Code extension).
// Giao thức giống vbook-extension-maker: GET /test với header `data` = base64(JSON).
//   node phone.js <ip:port của app> <đường dẫn script> [tham số 1] [tham số 2]...
// Ví dụ: node phone.js http://192.168.100.227:8080 ../../vinahentai/src/list.js https://vinahentai.click/danh-sach
const fs = require("fs");
const net = require("net");
const os = require("os");
const path = require("path");
const http = require("http");

const [,, appUrlArg, scriptArg, ...inputs] = process.argv;
if (!appUrlArg || !scriptArg) {
  console.error("Usage: node phone.js <http://ip:port> <script.js> [param...]");
  process.exit(1);
}
const appUrl = new URL(appUrlArg);
const scriptPath = path.resolve(scriptArg);
const extDir = path.resolve(scriptPath, "../../");     // <ext>/
const rootDir = path.resolve(extDir, "..");            // thư mục chứa <ext>/
const extName = path.basename(extDir);
const serverPort = Number(appUrl.port) - 10;

// IP LAN của PC cùng dải với điện thoại, để app gọi ngược lại lấy file khi script dùng load()
function localIp() {
  const prefix = appUrl.hostname.split(".").slice(0, 3).join(".");
  const all = Object.values(os.networkInterfaces()).flat().filter(a => a && a.family === "IPv4" && !a.internal).map(a => a.address);
  return all.find(ip => ip.startsWith(prefix + ".")) || all.find(ip => ip.startsWith("192.168.")) || all[0];
}

// Server phục vụ file cho load(): GET /?file=x.js&root=<ext>/src -> base64 nội dung
const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://x");
  const file = u.searchParams.get("file"), root = u.searchParams.get("root");
  if (!file || !root) { res.writeHead(400); return res.end("Missing file/root"); }
  fs.readFile(path.join(rootDir, root, file), "utf8", (err, data) => {
    if (err) { res.writeHead(500); return res.end("Error reading the file."); }
    const b64 = Buffer.from(data).toString("base64");
    res.writeHead(200, { "Content-Length": b64.length, "Content-Type": "text/plain" });
    res.end(b64);
  });
});

server.listen(serverPort, () => {
  const data = {
    ip: `http://${localIp()}:${serverPort}`,
    root: `${extName}/src`,
    language: "javascript",
    script: fs.readFileSync(scriptPath, "utf8"),
    input: inputs.length ? inputs : [""],
  };
  const request = ["GET /test HTTP/1.1", `Host: ${appUrl.hostname}`, "Connection: close",
    `data: ${Buffer.from(JSON.stringify(data)).toString("base64")}`, "", ""].join("\r\n");

  const chunks = [];
  const client = net.createConnection({ host: appUrl.hostname, port: Number(appUrl.port) }, () => client.write(request));
  client.setTimeout(120000, () => { console.error("Timeout"); client.destroy(); server.close(); });
  client.on("data", c => chunks.push(c));
  client.on("error", e => { console.error("Connection error:", e.message); server.close(); });
  client.on("end", () => {
    server.close();
    const raw = Buffer.concat(chunks).toString("utf8");
    const [, body = ""] = raw.split(/\r?\n\r?\n/, 2);
    try {
      const parsed = JSON.parse(body);
      // Trường nào là chuỗi JSON thì parse thêm một lớp cho dễ đọc
      for (const k of Object.keys(parsed)) {
        if (typeof parsed[k] === "string") { try { parsed[k] = JSON.parse(parsed[k]); } catch {} }
      }
      console.log(JSON.stringify(parsed, null, 2));
    } catch {
      console.log(raw);
    }
  });
});
