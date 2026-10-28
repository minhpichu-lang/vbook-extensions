// Mục lục. Toàn bộ chương có sẵn trong HTML (nút "Xem thêm" chỉ ẩn/hiện phía client),
// mới nhất trước -> đảo lại cho đúng thứ tự đọc.
load("site.js");

function execute(url) {
  var response = siteFetch(url);
  if (response == null) return Response.error("Không kết nối được tới trang");
  if (!response.ok) return Response.error("Không tải được mục lục (HTTP " + response.status + ")");

  var links = response.html().select("#nt_listchapter div.chapter a");
  var result = [];
  for (var i = 0; i < links.size(); i++) {
    var a = links.get(i);
    result.push({ name: ("" + a.text()).trim(), url: siteUrl(a.attr("href")) });
  }
  result.reverse();
  return Response.success(result);
}
