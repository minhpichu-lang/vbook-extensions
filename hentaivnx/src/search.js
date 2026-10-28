// Tìm kiếm: /tim-truyen?keyword=<key>&page=N (cùng layout với danh sách).
load("site.js");

function execute(key, page) {
  if (!page) page = "1";
  var pageNum = parseInt(page, 10);

  var response = siteFetch("/tim-truyen?keyword=" + encodeURIComponent(key) + "&page=" + pageNum);
  if (response == null) return Response.error("Không kết nối được tới trang");
  if (!response.ok) return Response.error("Không tìm kiếm được (HTTP " + response.status + ")");

  var doc = response.html();
  var items = parseList(doc);
  var next = items.length > 0 && hasNextPage(doc) ? "" + (pageNum + 1) : null;
  return Response.success(items, next);
}
