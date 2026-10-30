// Nội dung chương: danh sách URL ảnh.
// Chỉ 3 ảnh đầu có <img src>, phần còn lại lazy-load; nhưng toàn bộ URL đều nằm trong
// dữ liệu hydration của React Router theo đúng thứ tự trang, nên lấy bằng regex trên HTML thô.
// Ảnh gốc rất nặng (750–950 KB, ~4500x5800 px mỗi trang; ~27 MB/chương) và CDN không hỗ trợ resize.
// IMAGE_PROXY = true: đi qua Photon (i0.wp.com), ảnh còn ~1080 px / 50–300 KB — tiết kiệm data khi dùng 4G,
// nhưng lần tải đầu của mỗi ảnh mất 1–3 s (proxy phải kéo ảnh gốc). Mặc định false: tải thẳng (0.1–0.4 s/ảnh trên Wi-Fi).
load("site.js");

var IMAGE_PROXY = false;
var PROXY_WIDTH = 1080;

function execute(url) {
  var response = siteFetch(url);
  if (response == null) return Response.error("Không kết nối được tới trang (đã thử mọi tên miền)");
  if (!response.ok) return Response.error("Không tải được chương (HTTP " + response.status + ")");
  var html = "" + response.text();

  // Ảnh trang nằm trên CDN riêng (hiện là vnht.vinahentai.beer) dưới /manga-images/ —
  // không cố định host để CDN đổi tên miền vẫn chạy. Dừng ở dấu nháy, dấu \, khoảng trắng hoặc thẻ HTML.
  var re = /https?:\/\/[^\/"'\\\s<>]+\/manga-images\/[^"'\\\s<>]+/g;
  var images = [];
  var seen = {};
  var m;
  while ((m = re.exec(html)) !== null) {
    var src = m[0];
    if (seen[src]) continue;
    seen[src] = true;
    images.push(IMAGE_PROXY ? proxied(src) : src);
  }

  if (images.length == 0) return Response.error("Không tìm thấy ảnh trong chương");
  return Response.success(images);
}

function proxied(src) {
  return "https://i0.wp.com/" + src.replace(/^https?:\/\//, "") + "?w=" + PROXY_WIDTH + "&quality=75&strip=all";
}
