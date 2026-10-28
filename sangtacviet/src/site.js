// Cấu hình và hàm dùng chung cho mọi script (nạp bằng load("site.js")).
//
// URL truyện của site có dạng /truyen/<host>/1/<bookid>/ và URL chương là /truyen/<host>/1/<bookid>/<cid>/
// (host = nguồn gốc: qidian, fanqie, faloo, ciweimao, dich, sangtac...).
// Site có các domain phụ (sangtacviet.vip, sangtacviet.app) dùng chung dữ liệu, nên mọi request đều
// được ghép lại với BASE, bỏ qua domain mà app lưu trong URL cũ.

var BASE = "https://sangtacviet.com";

var HEADERS = {
  "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36",
};

// GET một path của site (hoặc URL đầy đủ, chỉ lấy phần path). `extraHeaders` được gộp thêm vào HEADERS.
function siteFetch(target, extraHeaders) {
  var headers = {};
  for (var k in HEADERS) headers[k] = HEADERS[k];
  if (extraHeaders) for (var k2 in extraHeaders) headers[k2] = extraHeaders[k2];
  try {
    return fetch(BASE + toPath(target), { headers: headers });
  } catch (e) {
    return null;
  }
}

function toPath(target) {
  var t = "" + target;
  if (t.indexOf("http") == 0) t = t.replace(/^https?:\/\/[^\/?#]+/, "");
  if (t.indexOf("/") != 0) t = "/" + t;
  return t;
}

function siteUrl(href) {
  return BASE + toPath(href);
}

// Tách host / bookid / cid từ URL truyện hoặc URL chương. Trả về null nếu không đúng dạng.
function parseBookUrl(url) {
  var m = toPath(url).match(/^\/truyen\/([^\/]+)\/1\/([^\/]+)\/?([^\/]*)\/?$/);
  if (!m) return null;
  return { host: m[1], bookid: m[2], cid: m[3] || "" };
}

function bookUrl(host, bookid) {
  return BASE + "/truyen/" + host + "/1/" + bookid + "/";
}

function chapterUrl(host, bookid, cid) {
  return bookUrl(host, bookid) + cid + "/";
}

// Trên engine của app, Elements.first() KHÔNG trả về null khi rỗng (trả về phần tử rỗng, text = "").
// Luôn dùng hàm này thay cho .select(x).first() để có null thật sự.
function first(el, selector) {
  var els = el.select(selector);
  return els.size() > 0 ? els.get(0) : null;
}

// Giải mã các HTML entity hay gặp trong text lấy bằng regex (ngoài jsoup).
function decodeEntities(s) {
  return ("" + s)
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

// Slug nhãn dùng cho tham số tag của API danh sách (giống hàm slugVietnamese của site): bỏ dấu, bỏ ký tự
// không phải chữ/số. Vd "Diễn sinh cùng người" -> "diensinhcungnguoi".
function slugVietnamese(str) {
  return ("" + str).toLowerCase()
    .replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a")
    .replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e")
    .replace(/ì|í|ị|ỉ|ĩ/g, "i")
    .replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o")
    .replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u")
    .replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "");
}

// Danh sách truyện từ API tìm kiếm của site: GET /io/searchtp/searchBooks?<query>&p=<trang>.
// API trả về HTML gồm các thẻ <a class="booksearch" href="/truyen/<host>/1/<id>/">, 48 truyện mỗi trang.
// Dùng chung cho list.js (khám phá / thể loại) và search.js.
function fetchList(query, page) {
  if (!page) page = "1";
  var pageNum = parseInt(page, 10);

  var response = siteFetch(query + "&p=" + pageNum);
  if (response == null) return Response.error("Không kết nối được tới trang");
  if (!response.ok) return Response.error("Không tải được danh sách (HTTP " + response.status + ")");

  var items = parseBooks(response.html());
  var next = items.length >= 48 ? "" + (pageNum + 1) : null;
  return Response.success(items, next);
}

function parseBooks(doc) {
  var cards = doc.select("a.booksearch");
  var result = [];
  for (var i = 0; i < cards.size(); i++) {
    var a = cards.get(i);
    var href = "" + a.attr("href");
    if (parseBookUrl(href) == null) continue;

    var titleEl = first(a, "b.searchbooktitle");
    var name = titleEl != null ? ("" + titleEl.text()).trim() : "";
    if (!name) continue;

    var img = first(a, "img");
    var cover = img != null ? "" + img.attr("src") : "";

    var authorEl = first(a, "span.searchbookauthor");
    var author = authorEl != null ? ("" + authorEl.text()).trim() : "";

    // Nhãn: nguồn, tình trạng, thể loại
    var tags = a.select("span.searchtag");
    var tagTexts = [];
    for (var j = 0; j < tags.size(); j++) {
      var t = ("" + tags.get(j).text()).trim();
      if (t) tagTexts.push(t);
    }

    var description = author;
    if (tagTexts.length) description += (description ? " • " : "") + tagTexts.join(", ");

    result.push({ name: name, link: siteUrl(href), cover: cover, description: description });
  }
  return result;
}
