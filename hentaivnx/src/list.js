// Phân trang danh sách truyện. url: path (có thể có query string), page: số trang (rỗng = 1).
load("site.js");

function execute(url, page) {
  if (!page) page = "1";
  var pageNum = parseInt(page, 10);
  var target = url + (url.indexOf("?") >= 0 ? "&" : "?") + "page=" + pageNum;

  var response = siteFetch(target);
  if (response == null) return Response.error("Không kết nối được tới trang");
  if (!response.ok) return Response.error("Không tải được danh sách (HTTP " + response.status + ")");

  var doc = response.html();
  var items = parseList(doc);
  var next = items.length > 0 && hasNextPage(doc) ? "" + (pageNum + 1) : null;
  return Response.success(items, next);
}
