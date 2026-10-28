// Thông tin truyện. url: https://<domain>/truyen-hentai/<slug> (domain có thể là domain cũ app đã lưu).
load("site.js");

function execute(url) {
  var response = siteFetch(url);
  if (response == null) return Response.error("Không kết nối được tới trang (đã thử mọi tên miền)");
  if (!response.ok) return Response.error("Không tải được thông tin truyện (HTTP " + response.status + ")");
  var doc = response.html();

  var h1 = first(doc, "h1");
  var name = h1 != null ? ("" + h1.text()).trim() : "";

  var og = first(doc, "meta[property='og:image']");
  var cover = og != null ? "" + og.attr("content") : "";

  // Tên khác nằm trong <div> ngay sau h1
  var altEl = first(doc, "h1 + div");
  var altName = altEl != null ? ("" + altEl.text()).trim() : "";

  var author = joinTexts(doc.select("a[href^='/authors/'] span.truncate"));
  var translators = joinTexts(doc.select("a[href^='/translators/'] span.truncate"));

  // Grid "Tình trạng: / Tác giả: / ..." — nhãn là div.w-28, giá trị là <div> kế tiếp
  var statusEl = first(doc, "div.w-28:containsOwn(Tình trạng) + div");
  var status = statusEl != null ? ("" + statusEl.text()).trim() : "";
  var ongoing = status.indexOf("Đang") == 0;

  var descEl = first(doc, "#manga-description-section div.whitespace-pre-line");
  var description = descEl != null ? ("" + descEl.text()).trim() : "";

  var detailLines = [];
  if (altName) detailLines.push("Tên khác: " + altName);
  if (status) detailLines.push("Tình trạng: " + status);
  if (translators) detailLines.push("Dịch giả: " + translators);

  // Thể loại: chỉ lấy chip có <span class="capitalize"> (link header/footer không có).
  // Trang chỉ render 8 thể loại đầu, phần còn lại ẩn sau nút "+N" (nằm trong payload React, không parse).
  var genres = [];
  var gl = doc.select("a[href^='/genres/']");
  var seen = {};
  for (var j = 0; j < gl.size(); j++) {
    var a = gl.get(j);
    var span = first(a, "span.capitalize");
    if (span == null) continue;
    var href = "" + a.attr("href");
    if (seen[href]) continue;
    seen[href] = true;
    genres.push({ title: ("" + span.text()).trim(), input: href, script: "list.js" });
  }

  // Gợi ý: truyện cùng tác giả / cùng nhóm dịch (các trang này có cùng layout danh sách)
  var suggests = [];
  var al = doc.select("a[href^='/authors/']");
  for (var k = 0; k < al.size(); k++) {
    var an = first(al.get(k), "span.truncate");
    if (an != null) suggests.push({ title: "Cùng tác giả: " + ("" + an.text()).trim(), input: "" + al.get(k).attr("href"), script: "list.js" });
  }
  var tl = doc.select("a[href^='/translators/']");
  for (var m = 0; m < tl.size(); m++) {
    var tn = first(tl.get(m), "span.truncate");
    if (tn != null) suggests.push({ title: "Nhóm dịch: " + ("" + tn.text()).trim(), input: "" + tl.get(m).attr("href"), script: "list.js" });
  }

  return Response.success({
    name: name,
    cover: cover,
    host: BASE,
    author: author,
    description: description,
    detail: detailLines.join("\n"),
    ongoing: ongoing,
    genres: genres,
    suggests: suggests,
  });
}

function joinTexts(els) {
  var out = [];
  for (var i = 0; i < els.size(); i++) {
    var t = ("" + els.get(i).text()).trim();
    if (t) out.push(t);
  }
  return out.join(", ");
}
