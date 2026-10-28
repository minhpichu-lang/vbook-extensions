// Đóng gói mọi extension (thư mục có plugin.json + src/) và đồng bộ version của từng extension vào index
// plugin.json ở thư mục gốc (mục có path ".../<thư mục>/plugin.zip"). GitHub Actions chạy script này mỗi lần push.
//   node build-all.js
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const root = path.resolve(__dirname, "../..");
const indexFile = path.join(root, "plugin.json");
const index = JSON.parse(fs.readFileSync(indexFile, "utf8"));

for (const dir of fs.readdirSync(root).sort()) {
  const extDir = path.join(root, dir);
  if (!fs.existsSync(path.join(extDir, "plugin.json")) || !fs.existsSync(path.join(extDir, "src"))) continue;
  execFileSync(process.execPath, [path.join(__dirname, "build.js"), extDir], { stdio: "inherit" });
  const version = JSON.parse(fs.readFileSync(path.join(extDir, "plugin.json"), "utf8")).metadata.version;
  for (const item of index.data) {
    if (item.path.endsWith("/" + dir + "/plugin.zip") && item.version !== version) {
      console.log(`index: ${item.name} ${item.version} -> ${version}`);
      item.version = version;
    }
  }
}
fs.writeFileSync(indexFile, JSON.stringify(index, null, 2) + "\n");
