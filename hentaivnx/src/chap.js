// Nội dung chương: danh sách URL ảnh.
// Trang chương không có <img> sẵn; danh sách ảnh của từng server nằm trong JS:
//   var cdn1 = '["https:\/\/sv3.2tcdn.cfd\/...\/1-0.webp", ...]'; var cdn2 = '[...]'; cdn3, cdn4 (có thể '[]')
// Server 1 (cdn1) là mặc định của web. Với vài truyện cũ, server 1 là ảnh qua DuckDuckGo của host đã chết
// (DDG trả 400) trong khi server sau vẫn sống -> dò ảnh đầu của từng server, chọn server đầu tiên tải được.
// Server 2 trên all.2tcdn.cfd có token hết hạn sau ~1 ngày nên chỉ dùng khi server 1 hỏng.
load("site.js");

function execute(url) {
  var response = siteFetch(url);
  if (response == null) return Response.error("Không kết nối được tới trang");
  if (!response.ok) return Response.error("Không tải được chương (HTTP " + response.status + ")");
  var html = "" + response.text();

  var servers = [];
  for (var n = 1; n <= 4; n++) {
    var images = parseServer(html, "cdn" + n);
    if (images.length > 0) servers.push(images);
  }
  if (servers.length == 0) return Response.error("Không tìm thấy ảnh trong chương");

  var referer = siteUrl(url);
  for (var i = 0; i < servers.length - 1; i++) {
    if (imageAlive(servers[i][0], referer)) return Response.success(servers[i]);
  }
  return Response.success(servers[servers.length - 1]);
}

function parseServer(html, name) {
  var m = html.match(new RegExp("var " + name + " = '(\\[.*?\\])';"));
  if (!m) return [];
  var list;
  try { list = JSON.parse(m[1]); } catch (e) { return []; }
  var out = [];
  for (var i = 0; i < list.length; i++) {
    // URL bị HTML-escape (&amp;); hậu tố "-----<phần trăm rộng>" là ảnh ghép ngang trên web, bỏ đi
    var src = ("" + list[i]).replace(/&amp;/g, "&").split("-----")[0];
    if (src) out.push(src);
  }
  return out;
}

// Chỉ xin 1 byte (CDN ảnh trả 206); DDG bỏ qua Range nhưng chỉ bị dò khi server trước đó hỏng.
function imageAlive(src, referer) {
  try {
    var r = fetch(src, { headers: { "User-Agent": HEADERS["User-Agent"], "Referer": referer, "Range": "bytes=0-0" } });
    return r.status == 200 || r.status == 206;
  } catch (e) {
    return false;
  }
}
