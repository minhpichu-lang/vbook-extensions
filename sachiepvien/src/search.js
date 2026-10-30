// Tìm kiếm theo tên/nội dung bài viết: REST posts?search=<key>.
load("site.js");

function execute(key, page) {
  var pageNum = parseInt(page || "1", 10);
  var r = wpFetch("posts?search=" + encodeURIComponent(key) + "&per_page=" + PER_PAGE + "&page=" + pageNum + "&_fields=link,title,excerpt");
  if (r == null) return Response.error("Không kết nối được tới trang");
  if (!r.ok) return Response.error("Không tìm kiếm được (HTTP " + r.status + ")");
  return Response.success(toList(r.data), pageNum < r.totalPages ? "" + (pageNum + 1) : null);
}
