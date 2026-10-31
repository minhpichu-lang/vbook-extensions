// Tìm kiếm theo tên truyện: REST posts?search=<key>&search_columns=post_title.
// Mặc định WordPress tìm cả nội dung, không phân biệt dấu và sắp theo ngày đăng, nên "tien" khớp ~90% số bài
// (bản convert nào cũng có "tiên/tiền/tiến") -> kết quả trông y như danh sách mới đăng.
load("site.js");

function execute(key, page) {
  var pageNum = parseInt(page || "1", 10);
  var r = wpFetch("posts?search=" + encodeURIComponent(key) + "&search_columns=post_title&orderby=relevance" +
    "&per_page=" + PER_PAGE + "&page=" + pageNum + "&_fields=link,title,excerpt");
  if (r == null) return Response.error("Không kết nối được tới trang");
  if (!r.ok) return Response.error("Không tìm kiếm được (HTTP " + r.status + ")");
  return Response.success(toList(r.data), pageNum < r.totalPages ? "" + (pageNum + 1) : null);
}
