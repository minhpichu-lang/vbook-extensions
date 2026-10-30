// Tìm kiếm: /?f_search=<key> (hỗ trợ cú pháp tag của E-Hentai, vd. language:vietnamese$).
// page: rỗng = trang đầu, sau đó là URL trang sau (?next=<gid>).
load("site.js");

function execute(key, page) {
  var response = siteFetch(page ? page : "/?f_search=" + encodeURIComponent(key));
  if (response == null) return Response.error("Không kết nối được tới E-Hentai");
  if (response.error) return Response.error(response.error);
  if (!response.ok) return Response.error("Không tìm kiếm được (HTTP " + response.status + ")");

  var doc = response.html();
  var items = parseList(doc);
  return Response.success(items, items.length > 0 ? nextPage(doc) : null);
}
