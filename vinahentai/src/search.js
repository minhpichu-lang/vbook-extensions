// Tìm kiếm: /search?q=<key>&page=N. Thẻ kết quả cùng dạng với danh sách.
load("site.js");

function execute(key, page) {
  if (!page) page = "1";
  var pageNum = parseInt(page, 10);

  var response = siteFetch("/search?q=" + encodeURIComponent(key) + "&page=" + pageNum);
  if (response == null) return Response.error("Không kết nối được tới trang (đã thử mọi tên miền)");
  if (!response.ok) return Response.error("Không tìm kiếm được (HTTP " + response.status + ")");

  var html = "" + response.text();
  var doc = Html.parse(html);

  var links = doc.select("a[href^='/truyen-hentai/']");
  var result = [];
  var seen = {};
  for (var i = 0; i < links.size(); i++) {
    var a = links.get(i);
    var href = "" + a.attr("href");
    if (href.indexOf("/", "/truyen-hentai/".length) >= 0) continue;
    if (seen[href]) continue;
    var img = first(a, "img");
    if (img == null) continue;
    seen[href] = true;

    var t = first(a, "h2");
    var name = t != null ? ("" + t.text()).trim() : ("" + a.attr("aria-label")).trim();
    var cover = "" + img.attr("src");
    var alt = first(a, "p.italic");
    var description = alt != null ? ("" + alt.text()).trim() : "";

    result.push({ name: name, link: siteUrl(href), cover: cover, description: description });
  }

  // Dữ liệu hydration có \"limit\",40 và \"total\",<số kết quả>
  var next = null;
  var total = html.match(/\\"total\\",(\d+)/);
  var limit = html.match(/\\"limit\\",(\d+)/);
  if (result.length > 0 && total && limit && pageNum * parseInt(limit[1], 10) < parseInt(total[1], 10)) {
    next = "" + (pageNum + 1);
  }
  return Response.success(result, next);
}
