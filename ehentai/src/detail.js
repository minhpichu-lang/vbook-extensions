// Thông tin gallery. url: https://e-hentai.org/g/<gid>/<token>
// Tên: #gn (tên Latin), #gj (tên gốc tiếng Nhật, có thể rỗng); bìa: background url() trong #gd1 div;
// thông tin: bảng #gdd (td.gdt1 nhãn, td.gdt2 giá trị); tag: #taglist, mỗi dòng một namespace (td.tc "artist:").
load("site.js");

var INFO_LABELS = { "Posted:": "Đăng lúc", "Language:": "Ngôn ngữ", "File Size:": "Dung lượng", "Length:": "Số trang", "Favorited:": "Yêu thích" };

function execute(url) {
  var response = fetchGallery(url);
  if (response == null) return Response.error("Không kết nối được tới E-Hentai");
  if (response.error) return Response.error(response.error);
  if (!response.ok) return Response.error("Không tải được gallery (HTTP " + response.status + ")");
  var doc = response.html();

  var gn = first(doc, "#gn");
  var gj = first(doc, "#gj");
  var name = gn != null ? ("" + gn.text()).trim() : "";
  var jpName = gj != null ? ("" + gj.text()).trim() : "";
  if (!name) name = jpName;

  var cover = "";
  var box = first(doc, "#gd1 div");
  if (box != null) {
    var m = ("" + box.attr("style")).match(/url\(([^)]+)\)/);
    if (m) cover = m[1];
  }

  var lines = [];
  if (jpName && jpName != name) lines.push(jpName);
  var cat = first(doc, "#gdc div");
  if (cat != null) lines.push("Loại: " + ("" + cat.text()).trim());
  var uploader = first(doc, "#gdn a");
  if (uploader != null) lines.push("Người đăng: " + ("" + uploader.text()).trim());
  var rows = doc.select("#gdd tr");
  for (var i = 0; i < rows.size(); i++) {
    var label = first(rows.get(i), "td.gdt1");
    var value = first(rows.get(i), "td.gdt2");
    if (label == null || value == null) continue;
    var vi = INFO_LABELS[("" + label.text()).trim()];
    if (vi) lines.push(vi + ": " + ("" + value.text()).replace(/ /g, " ").trim().replace(/ pages?$/, "").replace(/ times?$/, " lần"));
  }
  var rating = first(doc, "#rating_label");
  if (rating != null) lines.push("Đánh giá: " + ("" + rating.text()).replace("Average:", "").trim());

  // Tag: tác giả lấy từ artist (không có thì group), mô tả liệt kê tag theo namespace, genres để bấm vào xem gallery cùng tag.
  var tags = {};
  var genres = [];
  var desc = [];
  var tagRows = doc.select("#taglist tr");
  for (var r = 0; r < tagRows.size(); r++) {
    var ns = first(tagRows.get(r), "td.tc");
    var nsName = ns != null ? ("" + ns.text()).replace(":", "").trim() : "";
    var links = tagRows.get(r).select("td a");
    var names = [];
    for (var k = 0; k < links.size(); k++) {
      var tag = ("" + links.get(k).text()).trim();
      names.push(tag);
      genres.push({ title: tag, input: toPath(links.get(k).attr("href")), script: "list.js" });
    }
    tags[nsName] = names;
    desc.push("<b>" + nsName + "</b>: " + names.join(", "));
  }
  var author = (tags["artist"] || tags["group"] || []).join(", ");
  if (!author && uploader != null) author = ("" + uploader.text()).trim();

  return Response.success({
    name: name,
    cover: cover,
    host: BASE,
    author: author,
    description: desc.join("<br>"),
    detail: lines.join("<br>"), // app hiển thị detail dạng HTML, "\n" không xuống dòng
    ongoing: false,
    genres: genres,
  });
}
