// Phân trang danh sách truyện (trang chủ / thể loại / tác giả / nhóm dịch).
// url: path hoặc URL đầy đủ của danh sách (có thể đã có query string), page: số trang (rỗng = trang 1).
load("site.js");

function execute(url, page) {
  if (!page) page = "1";
  var pageNum = parseInt(page, 10);
  var target = url + (url.indexOf("?") >= 0 ? "&" : "?") + "page=" + pageNum;

  var response = fetchRetry(target, 3);
  if (response == null) return Response.error("Không kết nối được tới trang (đã thử mọi tên miền)");
  if (!response.ok) return Response.error("Không tải được danh sách (HTTP " + response.status + ")");

  var items = parseCards(response.html());

  // Chỉ /danh-sach và /genres/* có phân trang (trang ngoài phạm vi trả về 0 truyện).
  // /leaderboard, /authors/*, /translators/* bỏ qua tham số page -> chỉ 1 trang.
  var paged = url.indexOf("/danh-sach") >= 0 || url.indexOf("/genres/") >= 0;
  var next = paged && items.length > 0 ? "" + (pageNum + 1) : null;
  return Response.success(items, next);
}

// Mỗi truyện là 1 thẻ <a href="/truyen-hentai/<slug>"> chứa ảnh bìa và tên.
function parseCards(doc) {
  var links = doc.select("a[href^='/truyen-hentai/']");
  var result = [];
  var seen = {};
  for (var i = 0; i < links.size(); i++) {
    var a = links.get(i);
    var href = "" + a.attr("href");
    // Bỏ link chương (/truyen-hentai/slug/chap-x) và link trùng
    if (href.indexOf("/", "/truyen-hentai/".length) >= 0) continue;
    if (seen[href]) continue;

    var img = first(a, "img");
    if (img == null) continue;
    seen[href] = true;

    var name = ("" + a.attr("aria-label")).trim();
    if (!name) {
      var t = first(a, "h2, h3, div.font-semibold");
      name = t != null ? ("" + t.text()).trim() : ("" + img.attr("alt")).trim();
    }
    var cover = "" + img.attr("src");
    if (!cover || cover.indexOf("data:") == 0) cover = "" + img.attr("data-src");

    var description = "";
    var chap = first(a, "span.truncate");
    if (chap != null) description = ("" + chap.text()).trim();

    result.push({ name: name, link: siteUrl(href), cover: cover, description: description });
  }
  return result;
}

// Máy chủ gốc thỉnh thoảng phản hồi rất chậm hoặc lỗi tạm thời (5xx/429), nhất là khi
// app tải nhiều danh sách cùng lúc — thử lại vài lần trước khi báo lỗi.
function fetchRetry(target, attempts) {
  var last = null;
  for (var i = 0; i < attempts; i++) {
    last = siteFetch(target);
    if (last == null) return null;
    if (last.ok) return last;
    if (last.status >= 400 && last.status < 500 && last.status != 429) return last;
    if (i < attempts - 1) sleep(1500);
  }
  return last;
}
