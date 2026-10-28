// Mục lục. url: URL truyện (giống detail).
// Site tải danh sách chương bằng AJAX: GET /index.php?ngmar=chapterlist&h=<host>&bookid=<id>&sajax=getchapterlist
// (bắt buộc có header Referer, nếu không server trả về rỗng). Kết quả JSON {code, data}, data là chuỗi
// "<số>-/-<cid>-/-<tên chương>[-/-vip|unvip]" nối nhau bằng "-//-".
load("site.js");

function execute(url) {
  var info = parseBookUrl(url);
  if (info == null) return Response.error("URL truyện không đúng dạng /truyen/<nguồn>/1/<id>/");

  var api = "/index.php?ngmar=chapterlist&h=" + info.host + "&bookid=" + info.bookid + "&sajax=getchapterlist";
  var response = siteFetch(api, { Referer: bookUrl(info.host, info.bookid) });
  if (response == null) return Response.error("Không kết nối được tới trang");
  if (!response.ok) return Response.error("Không tải được mục lục (HTTP " + response.status + ")");

  var text = ("" + response.text()).trim();
  if (!text) return Response.error("Server không trả về mục lục, thử lại sau");
  var json;
  try { json = JSON.parse(text); } catch (e) { return Response.error("Mục lục trả về không đúng định dạng"); }
  if (json.code != 1) return Response.error(json.err ? "" + json.err : "Truyện đã bị xóa hoặc chưa có chương");
  if (!json.data) return Response.error("Tải danh sách chương thất bại hoặc nguồn đã hỏng");

  var rows = ("" + json.data).split("-//-");
  var result = [];
  for (var i = 0; i < rows.length; i++) {
    var cols = rows[i].split("-/-");
    if (cols.length < 3) continue;
    var cid = cols[1].trim();
    if (!cid) continue;
    var name = cols[2].replace(/[\t\n]+|<br>|&nbsp;/g, " ").replace(/\s+/g, " ").trim();
    // Chương VIP (chưa mở khóa) vẫn liệt kê nhưng đánh dấu, đọc sẽ báo lỗi từ server
    if (cols.length > 3 && cols[3].trim() == "vip") name += " (VIP)";
    result.push({ name: name, url: chapterUrl(info.host, info.bookid, cid) });
  }
  // Riêng nguồn uukanshu liệt kê chương mới nhất trước
  if (info.host == "uukanshu") result.reverse();
  return Response.success(result);
}
