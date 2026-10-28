// Cấu hình tên miền và helper dùng chung cho mọi script (nạp bằng load("site.js")).
//
// Site hay đổi tên miền (hentaivnx.live, .com, ...). Khi đổi:
//   - vbook 1.1.x: cài đặt extension -> "Add code" -> gõ: let DOMAIN = "https://www.hentaivnx.<đuôi mới>";
//   - hoặc sửa DEFAULT_BASE bên dưới.
// URL app đã lưu (truyện đánh dấu) mang domain cũ -> siteFetch chỉ lấy phần path và ghép với domain hiện tại.
// Nếu domain cũ redirect sang domain mới thì BASE tự cập nhật theo URL cuối của response.

var DEFAULT_BASE = configuredBase("https://www.hentaivnx.live");

var HEADERS = {
  "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36",
};

var BASE = DEFAULT_BASE;

// Tải một trang của site. `target` là path ("/tim-truyen?page=2") hoặc URL đầy đủ.
// Body của Response chỉ đọc được MỘT lần, nên trả về wrapper giữ sẵn body. null nếu lỗi mạng.
function siteFetch(target) {
  var r = null;
  try { r = fetch(BASE + toPath(target), { headers: HEADERS }); } catch (e) { r = null; }
  if (r == null) return null;
  BASE = originOf("" + r.url) || BASE;
  var body = "";
  try { body = "" + r.text(); } catch (e2) { body = ""; }
  return {
    ok: r.ok,
    status: r.status,
    text: function () { return body; },
    html: function () { return Html.parse(body); },
  };
}

function configuredBase(fallback) {
  var d = "";
  try { if (typeof DOMAIN != "undefined" && DOMAIN) d = ("" + DOMAIN).trim().replace(/\/+$/, ""); } catch (e) { d = ""; }
  if (!d) return fallback;
  if (d.indexOf("http") != 0) d = "https://" + d;
  return originOf(d) || fallback;
}

function originOf(url) {
  var m = ("" + url).match(/^(https?:\/\/[^\/?#]+)/);
  return m ? m[1] : "";
}

function toPath(target) {
  var t = "" + target;
  if (t.indexOf("http") == 0) t = t.replace(/^https?:\/\/[^\/?#]+/, "");
  if (t.indexOf("/") != 0) t = "/" + t;
  return t;
}

// Link của site là URL tuyệt đối theo domain đang chạy -> chuẩn hóa về BASE hiện tại.
function siteUrl(href) {
  return BASE + toPath(href);
}

// Một số tên truyện (nhập từ WordPress) bị escape 2 lần: text() vẫn còn "&#8230;", "&#8217;"...
function decodeEntities(s) {
  return ("" + s).replace(/&#(\d+);/g, function (m, n) { return String.fromCharCode(parseInt(n, 10)); })
    .replace(/&amp;/g, "&").trim();
}

// Trên engine của app, Elements.first() KHÔNG trả về null khi rỗng -> luôn dùng hàm này.
function first(el, selector) {
  var els = el.select(selector);
  return els.size() > 0 ? els.get(0) : null;
}

// Danh sách truyện (trang chủ, /tim-truyen, thể loại, tìm kiếm) dùng chung một layout:
// div.items > div.item > figure (ảnh + figcaption có tên và chương mới nhất).
function parseList(doc) {
  var items = doc.select("div.items div.item");
  var result = [];
  for (var i = 0; i < items.size(); i++) {
    var item = items.get(i);
    var a = first(item, "figcaption h3 a");
    if (a == null) continue;
    var img = first(item, "div.image img");
    var cover = "";
    if (img != null) {
      cover = "" + img.attr("data-original");
      if (!cover) cover = "" + img.attr("src");
    }
    var chap = first(item, "figcaption li.chapter a");
    result.push({
      name: decodeEntities(a.text()),
      link: siteUrl(a.attr("href")),
      cover: cover,
      description: chap != null ? ("" + chap.text()).trim() : "",
    });
  }
  return result;
}

// Phân trang: còn trang sau khi có nút "›" (a[rel=next]) trong ul.pagination.
function hasNextPage(doc) {
  return doc.select("ul.pagination a[rel=next]").size() > 0;
}
