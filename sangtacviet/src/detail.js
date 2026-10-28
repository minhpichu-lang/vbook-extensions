// Thông tin truyện. url: https://sangtacviet.com/truyen/<host>/1/<bookid> (app đã bỏ dấu / cuối).
load("site.js");

function execute(url) {
  var info = parseBookUrl(url);
  if (info == null) return Response.error("URL truyện không đúng dạng /truyen/<nguồn>/1/<id>/");

  var response = siteFetch(bookUrl(info.host, info.bookid));
  if (response == null) return Response.error("Không kết nối được tới trang");
  if (!response.ok) return Response.error("Không tải được thông tin truyện (HTTP " + response.status + ")");

  var html = "" + response.text();
  var doc = Html.parse(html);

  var h1 = first(doc, "h1#book_name2");
  var name = h1 != null ? ("" + h1.text()).trim() : "";
  if (!name) return Response.error("Không tìm thấy truyện (có thể đã bị xóa)");

  // Ảnh bìa nằm trong biến JS `bookinfo` (thumb) chứ không có trong thẻ <img>
  var cover = "";
  var thumb = html.match(/"thumb":"((?:[^"\\]|\\.)*)"/);
  if (thumb) cover = thumb[1].replace(/\\\//g, "/");

  var authorEl = first(doc, "h1#book_name2 ~ i.cap h2");
  var author = authorEl != null ? ("" + authorEl.text()).trim() : "";
  if (!author) author = infoLine(html, "Tác giả:");

  var descEl = first(doc, "#book-sumary span");
  var description = descEl != null ? cleanText(descEl.html()) : "";

  // var bookstep=1: 1 = Còn tiếp, 2 = Tạm ngưng, 3 = Hoàn thành
  var step = html.match(/var bookstep\s*=\s*(\d+)/);
  var stepNum = step ? parseInt(step[1], 10) : 1;
  var status = stepNum == 3 ? "Hoàn thành" : stepNum == 2 ? "Tạm ngưng" : "Còn tiếp";

  var genreText = infoLine(html, "Thể loại:");
  var detailLines = ["Tình trạng: " + status, "Nguồn: " + info.host];
  var oriName = first(doc, "#oriname");
  if (oriName != null && ("" + oriName.text()).trim()) detailLines.push("Tên gốc: " + ("" + oriName.text()).trim());
  var hanViet = infoLine(html, "Hán việt:");
  if (hanViet) detailLines.push("Hán việt: " + hanViet);
  if (genreText) detailLines.push("Thể loại: " + genreText);
  var lastUpdate = html.match(/"lastupdate":"([^"]*)"/);
  if (lastUpdate) detailLines.push("Chương mới: " + lastUpdate[1]);

  // Thể loại trên trang là chữ tự do; API danh sách lọc được bằng tag=<slug không dấu>,
  var genres = [];
  var parts = genreText.split(",");
  for (var i = 0; i < parts.length; i++) {
    var g = parts[i].trim();
    if (g) genres.push({ title: g, input: "/io/searchtp/searchBooks?find=&minc=0&sort=viewweek&tag=" + slugVietnamese(g) + ",", script: "list.js" });
  }

  var suggests = [];
  if (author) suggests.push({ title: "Cùng tác giả: " + author, input: "/io/searchtp/searchBooks?find=&findinname=" + encodeURIComponent(author) + "&minc=0&sort=update&tag=", script: "list.js" });
  suggests.push({ title: "Đọc nhiều tuần (" + info.host + ")", input: "/io/searchtp/searchBooks?find=&host=" + info.host + "&minc=0&sort=viewweek&tag=", script: "list.js" });

  return Response.success({
    name: name,
    cover: cover,
    host: BASE,
    author: author,
    description: description,
    detail: detailLines.join("\n"),
    ongoing: stepNum != 3,
    genres: genres,
    suggests: suggests,
  });
}

// Các dòng "Nhãn:&nbsp;&nbsp; giá trị" trong khối Thông tin
function infoLine(html, label) {
  var m = html.match(new RegExp(label + "((?:&nbsp;|\\s)*)([^<]*)"));
  return m ? decodeEntities(m[2]).trim() : "";
}

// HTML tóm tắt dùng <br> ngắt dòng -> text thuần có xuống dòng
function cleanText(h) {
  return decodeEntities(("" + h).replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, ""))
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
