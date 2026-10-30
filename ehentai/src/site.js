// Helper dùng chung cho mọi script (nạp bằng load("site.js")).
// Không đăng nhập: danh sách mặc định là chế độ Compact (table.itg.gltc), trang gallery có 20 ảnh thu nhỏ/trang.

var BASE = "https://e-hentai.org";

var HEADERS = {
  "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36",
};

// Tải một trang. `target` là path ("/popular") hoặc URL đầy đủ.
// Trả về { ok, status, text(), html(), error } (body đã đọc sẵn vì chỉ đọc được một lần), null nếu lỗi mạng.
// error: thông báo khi site trả trang lỗi với HTTP 200 (bị khóa IP, gallery đã xóa...).
function siteFetch(target) {
  var r = null;
  try { r = fetch(toUrl(target), { headers: HEADERS }); } catch (e) { r = null; }
  if (r == null) return null;
  var body = "";
  try { body = "" + r.text(); } catch (e2) { body = ""; }
  return {
    ok: r.ok,
    status: r.status,
    error: pageError(body),
    text: function () { return body; },
    html: function () { return Html.parse(body); },
  };
}

function pageError(body) {
  if (body.indexOf("Your IP address has been temporarily banned") >= 0) return "E-Hentai tạm khóa IP vì tải trang quá nhiều, đợi một lúc rồi thử lại";
  if (body.indexOf("This gallery has been removed or is unavailable") >= 0) return "Gallery đã bị xóa hoặc không còn trên E-Hentai";
  if (body.indexOf("Key missing, or incorrect key provided") >= 0) return "Link gallery không đúng";
  return "";
}

// Gallery bị gắn cờ "Offensive" hiện trang Content Warning thay vì nội dung -> tải lại với nw=always.
function fetchGallery(url) {
  var response = siteFetch(url);
  if (response != null && response.ok && response.text().indexOf("nw=always") >= 0 && response.text().indexOf("id=\"gdt\"") < 0) {
    response = siteFetch(url + (url.indexOf("?") >= 0 ? "&" : "?") + "nw=always");
  }
  return response;
}

function toUrl(target) {
  var t = "" + target;
  if (t.indexOf("http") == 0) return t;
  if (t.indexOf("/") != 0) t = "/" + t;
  return BASE + t;
}

function toPath(href) {
  return ("" + href).replace(/^https?:\/\/[^\/?#]+/, "");
}

// Trên engine của app, Elements.first() KHÔNG trả về null khi rỗng -> luôn dùng hàm này.
function first(el, selector) {
  var els = el.select(selector);
  return els.size() > 0 ? els.get(0) : null;
}

// Danh sách gallery (trang chủ, tìm kiếm, thể loại, tag, popular, toplist) chế độ Compact:
// mỗi dòng table.itg có td.glname a (link + div.glink tên), div.glthumb img (bìa, lazy -> data-src).
function parseList(doc) {
  var rows = doc.select("table.itg tr");
  var result = [];
  for (var i = 0; i < rows.size(); i++) {
    var row = rows.get(i);
    var a = first(row, "td.glname a");
    if (a == null) continue;
    var title = first(a, "div.glink");

    var cover = "";
    var img = first(row, "div.glthumb img");
    if (img != null) {
      cover = "" + img.attr("data-src");
      if (!cover) cover = "" + img.attr("src");
    }

    var info = [];
    var cat = first(row, "td.gl1c div.cn");
    if (cat != null) info.push(("" + cat.text()).trim());
    var pages = ("" + row.html()).match(/(\d+) pages?</);
    if (pages) info.push(pages[1] + " trang");
    var posted = first(row, "div[id^=posted_]");
    if (posted != null) info.push(("" + posted.text()).trim());

    result.push({
      name: ("" + (title != null ? title.text() : a.text())).trim(),
      link: "" + a.attr("href"),
      cover: cover,
      description: info.join(" · "),
    });
  }
  return result;
}

// Trang sau: danh sách/tìm kiếm dùng con trỏ ?next=<gid> (a#unext), toplist dùng ?p=N (ô sau ô hiện tại
// trong table.ptt). Trả về URL đầy đủ của trang sau (vbook đưa lại vào `page`), null nếu hết.
function nextPage(doc) {
  var a = first(doc, "a#unext");
  if (a == null) a = first(doc, "table.ptt td.ptds + td a");
  return a != null ? ("" + a.attr("href")).replace(/&amp;/g, "&") : null;
}
