// Danh sách gallery. url: path của danh sách, page: rỗng = trang đầu, sau đó là URL trang sau do nextPage() trả về.
load("site.js");

function execute(url, page) {
  var response = siteFetch(page ? page : url);
  if (response == null) return Response.error("Không kết nối được tới E-Hentai");
  if (response.error) return Response.error(response.error);
  if (!response.ok) return Response.error("Không tải được danh sách (HTTP " + response.status + ")");

  var doc = response.html();
  var items = parseList(doc);
  return Response.success(items, items.length > 0 ? nextPage(doc) : null);
}
