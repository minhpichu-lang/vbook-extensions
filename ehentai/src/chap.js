// Ảnh của một trang thu nhỏ: url = https://e-hentai.org/g/<gid>/<token>/?p=N (từ toc.js).
// #gdt a trỏ tới trang xem từng ảnh /s/<imgkey>/<gid>-<số>; URL ảnh thật (máy chủ Hentai@Home, đổi theo lần tải)
// nằm trong <img id="img" src="...">. Hết hạn mức xem ảnh thì site trả ảnh 509.gif.
load("site.js");

function execute(url) {
  var response = fetchGallery(url);
  if (response == null) return Response.error("Không kết nối được tới E-Hentai");
  if (response.error) return Response.error(response.error);
  if (!response.ok) return Response.error("Không tải được gallery (HTTP " + response.status + ")");

  var links = response.html().select("#gdt a");
  if (links.size() == 0) return Response.error("Không tìm thấy ảnh");

  var images = [];
  for (var i = 0; i < links.size(); i++) {
    var page = "" + links.get(i).attr("href");
    var img = imageOf(page);
    if (img.error) return Response.error(img.error);
    if (img.src.indexOf("/509.gif") >= 0) return Response.error("Đã hết hạn mức xem ảnh của E-Hentai, đợi vài giờ rồi thử lại");
    images.push(img.src);
  }
  return Response.success(images);
}

// Tải trang /s/ (lỗi mạng/HTTP thì thử lại 1 lần) và lấy src của img#img -> { src } hoặc { error }.
function imageOf(pageUrl) {
  for (var attempt = 0; attempt < 2; attempt++) {
    var r = siteFetch(pageUrl);
    if (r != null && r.error) return { error: r.error };
    if (r != null && r.ok) {
      var m = r.text().match(/<img id="img" src="([^"]+)"/);
      if (m) return { src: m[1].replace(/&amp;/g, "&") };
    }
    if (attempt == 0) sleep(1000);
  }
  return { error: "Không tải được trang ảnh " + pageUrl };
}
