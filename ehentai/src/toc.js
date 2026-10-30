// Mục lục. Gallery là một tập ảnh, nhưng muốn có URL ảnh phải tải trang /s/ của TỪNG ảnh (chap.js),
// nên chia gallery theo trang ảnh thu nhỏ của site (?p=0, 1, ...; 20 ảnh/trang khi không đăng nhập):
// mỗi "chương" là một trang thu nhỏ, chap.js tải 1 trang thu nhỏ + 20 trang ảnh.
load("site.js");

function execute(url) {
  var base = ("" + url).replace(/[?#].*$/, "").replace(/\/+$/, "") + "/";
  var response = fetchGallery(base);
  if (response == null) return Response.error("Không kết nối được tới E-Hentai");
  if (response.error) return Response.error(response.error);
  if (!response.ok) return Response.error("Không tải được gallery (HTTP " + response.status + ")");

  var doc = response.html();
  var perPage = doc.select("#gdt a").size();
  var m = response.text().match(/>(\d+) pages?</);
  var total = m ? parseInt(m[1], 10) : perPage;
  if (perPage == 0 || total == 0) return Response.error("Gallery không có ảnh");

  var result = [];
  var chapters = Math.ceil(total / perPage);
  for (var p = 0; p < chapters; p++) {
    var from = p * perPage + 1;
    var to = Math.min(total, from + perPage - 1);
    var name = chapters == 1 ? "Toàn bộ (" + total + " ảnh)" : from == to ? "Ảnh " + from : "Ảnh " + from + "–" + to;
    result.push({ name: name, url: base + "?p=" + p });
  }
  return Response.success(result);
}
