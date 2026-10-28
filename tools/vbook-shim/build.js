// Đóng gói extension thành plugin.zip (plugin.json + icon.png + src/*.js) để cài vào vbook
// qua "Thêm extension" (chọn tệp) hoặc phân phối qua nguồn (index JSON).
//   node build.js <thư mục extension>
const fs = require("fs");
const path = require("path");
const AdmZip = require("adm-zip");

const extDir = path.resolve(process.argv[2] || ".");
const plugin = JSON.parse(fs.readFileSync(path.join(extDir, "plugin.json"), "utf8"));
const out = path.join(extDir, "plugin.zip");

const zip = new AdmZip();
zip.addLocalFile(path.join(extDir, "plugin.json"));
zip.addLocalFile(path.join(extDir, "icon.png"));
for (const f of fs.readdirSync(path.join(extDir, "src")).sort()) {
  if (f.endsWith(".js") && !f.startsWith("_")) zip.addLocalFile(path.join(extDir, "src", f), "src");
}
// Cố định thời gian, hệ điều hành tạo zip (Unix) và quyền file (644) trong zip: cùng nội dung -> cùng zip trên
// Windows lẫn GitHub Actions (Linux), không tạo commit thừa
for (const e of zip.getEntries()) {
  e.header.time = new Date(2000, 0, 1);
  e.header.made = 788;
  e.header.attr = 0o100644 * 0x10000;
}
zip.writeZip(out);
console.log(`${plugin.metadata.name} v${plugin.metadata.version} -> ${out}`);
for (const e of zip.getEntries()) console.log("  " + e.entryName + "  " + e.header.size + " B");
