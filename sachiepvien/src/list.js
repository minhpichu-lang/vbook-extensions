// Danh sách truyện. url: truy vấn REST, vd "posts?categories=34"; page: số trang (null = 1).
// Có trang sau khi page < X-WP-TotalPages.
load("site.js");

function execute(url, page) {
  var pageNum = parseInt(page || "1", 10);
  var r = wpFetch(url + "&per_page=" + PER_PAGE + "&page=" + pageNum + "&_fields=link,title,excerpt");
  if (r == null) return Response.error("Không kết nối được tới trang");
  if (!r.ok) return Response.error("Không tải được danh sách truyện (HTTP " + r.status + ")");
  return Response.success(toList(r.data), pageNum < r.totalPages ? "" + (pageNum + 1) : null);
}
