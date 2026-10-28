// Danh sách thể loại, lấy từ trang /genres. Mỗi thể loại gọi list.js với input là path.
load("site.js");

function execute() {
  var response = siteFetch("/genres");
  if (response == null) return Response.error("Không kết nối được tới trang (đã thử mọi tên miền)");
  if (!response.ok) return Response.error("Không tải được danh sách thể loại (HTTP " + response.status + ")");

  var doc = response.html();
  // Thẻ thể loại trong grid có div tiêu đề bên trong; link ở header/footer thì không -> bỏ qua
  var links = doc.select("a[href^='/genres/']");
  var result = [];
  var seen = {};
  for (var i = 0; i < links.size(); i++) {
    var a = links.get(i);
    var href = "" + a.attr("href");
    if (seen[href]) continue;
    var titleEl = first(a, "div.font-semibold");
    if (titleEl == null) continue;
    seen[href] = true;
    result.push({ title: ("" + titleEl.text()).trim(), input: href, script: "list.js" });
  }
  return Response.success(result);
}
