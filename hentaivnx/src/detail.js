// Thông tin truyện. url: https://<domain>/truyen-hentai/<slug>-<id>.
// Site không có phần tóm tắt nội dung; khối "Preview" chỉ là ảnh trang đầu.
load("site.js");

function execute(url) {
  var response = siteFetch(url);
  if (response == null) return Response.error("Không kết nối được tới trang");
  if (!response.ok) return Response.error("Không tải được thông tin truyện (HTTP " + response.status + ")");
  var doc = response.html();

  var h1 = first(doc, "h1.title-detail");
  var name = h1 != null ? decodeEntities(h1.text()) : "";

  var img = first(doc, "#item-detail .col-image img");
  var cover = img != null ? "" + img.attr("src") : "";

  var author = infoText(doc, "li.author");
  var status = infoText(doc, "li.status");

  var detailLines = [];
  if (status) detailLines.push("Tình trạng: " + status);
  var views = infoText(doc, "li.row:has(i.fa-eye)");
  if (views) detailLines.push("Lượt xem: " + views);

  var genres = [];
  var gl = doc.select("li.kind a");
  for (var i = 0; i < gl.size(); i++) {
    genres.push({ title: ("" + gl.get(i).text()).trim(), input: toPath(gl.get(i).attr("href")), script: "list.js" });
  }

  return Response.success({
    name: name,
    cover: cover,
    host: BASE,
    author: author,
    description: "",
    detail: detailLines.join("<br>"), // app hiển thị detail dạng HTML, "\n" không xuống dòng
    ongoing: status.indexOf("Hoàn thành") < 0,
    genres: genres,
  });
}

// Giá trị của một dòng trong ul.list-info (cột p.col-xs-8)
function infoText(doc, rowSelector) {
  var p = first(doc, "ul.list-info " + rowSelector + " p.col-xs-8");
  return p != null ? ("" + p.text()).trim() : "";
}
