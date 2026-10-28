// Danh sách thể loại, lấy từ menu "Thể loại" (a[data-title] trỏ tới /tim-truyen/<slug>).
load("site.js");

function execute() {
  var response = siteFetch("/tim-truyen");
  if (response == null) return Response.error("Không kết nối được tới trang");
  if (!response.ok) return Response.error("Không tải được danh sách thể loại (HTTP " + response.status + ")");

  var links = response.html().select("a[data-title][href*='/tim-truyen/']");
  var result = [];
  var seen = {};
  for (var i = 0; i < links.size(); i++) {
    var path = toPath(links.get(i).attr("href"));
    if (seen[path]) continue;
    seen[path] = true;
    result.push({ title: ("" + links.get(i).attr("data-title")).trim(), input: path, script: "list.js" });
  }
  return Response.success(result);
}
