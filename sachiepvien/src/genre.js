// Thể loại = thẻ (post_tag, vd "Không Nón Không Loạn", "Cao H") + loại truyện (dealstore, vd "Truyện Convert Thô").
// Tên endpoint REST của taxonomy trùng tên tham số lọc bài viết: /tags -> posts?tags=<id>.
// Vài tên có ở cả hai ("Banned", "Vực sâu vạn trượng") -> chỉ giữ mục đầu.
load("site.js");

function execute() {
  var result = [], seen = {};
  var taxonomies = ["tags", "dealstore"];
  for (var t = 0; t < taxonomies.length; t++) {
    var r = wpFetch(taxonomies[t] + "?per_page=100&orderby=count&order=desc&hide_empty=true&_fields=id,name");
    if (r == null) return Response.error("Không kết nối được tới trang");
    if (!r.ok) return Response.error("Không tải được danh sách thể loại (HTTP " + r.status + ")");
    for (var i = 0; i < r.data.length; i++) {
      var title = decodeEntities(r.data[i].name);
      if (seen[title.toLowerCase()]) continue;
      seen[title.toLowerCase()] = true;
      result.push({ title: title, input: "posts?" + taxonomies[t] + "=" + r.data[i].id, script: "list.js" });
    }
  }
  return Response.success(result);
}
