// Mục lục. url: URL truyện (giống detail). Trang liệt kê chương mới nhất trước, đảo lại cho đúng thứ tự đọc.
load("site.js");

function execute(url) {
  var response = siteFetch(url);
  if (response == null) return Response.error("Không kết nối được tới trang (đã thử mọi tên miền)");
  if (!response.ok) return Response.error("Không tải được mục lục (HTTP " + response.status + ")");
  var doc = response.html();

  // Đường dẫn truyện, dùng để lọc link chương: /truyen-hentai/<slug>/<chap>.
  // url nhận vào đã percent-encode (do list.js trả ra) còn href trong HTML là Unicode thô,
  // nên so khớp bằng cả hai dạng.
  var path = toPath(url).replace(/\/+$/, "");
  var rawPath = path;
  try { rawPath = decodeURIComponent(path); } catch (e) {}

  // Ưu tiên các dòng trong khung danh sách chương
  var links = selectChapterLinks(doc, "a.block.w-full.px-4.py-2", path, rawPath);
  // Dự phòng: mọi link chương trên trang (gồm nút "Đọc từ đầu"/"Đọc mới nhất")
  if (links.length == 0) links = selectChapterLinks(doc, "a", path, rawPath);

  var result = [];
  var seen = {};
  for (var i = 0; i < links.length; i++) {
    var a = links[i];
    var href = "" + a.attr("href");
    if (seen[href]) continue;
    seen[href] = true;

    var nameEl = first(a, "span.text-txt-primary");
    var name = nameEl != null ? ("" + nameEl.text()).trim() : ("" + a.attr("aria-label")).trim();
    if (!name) name = ("" + a.text()).trim();

    result.push({ name: name, url: siteUrl(href) });
  }
  result.reverse();
  return Response.success(result);
}

function selectChapterLinks(doc, selector, path, rawPath) {
  var out = [];
  var els = doc.select(selector + "[href^='/truyen-hentai/']");
  for (var i = 0; i < els.size(); i++) {
    var href = "" + els.get(i).attr("href");
    if (href.indexOf(rawPath + "/") == 0 || href.indexOf(path + "/") == 0) out.push(els.get(i));
  }
  return out;
}
