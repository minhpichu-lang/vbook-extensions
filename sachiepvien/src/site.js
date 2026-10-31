// Helper dùng chung cho mọi script (nạp bằng load("site.js")).
//
// sachiepvien.net là WordPress: danh sách, tìm kiếm, chi tiết lấy qua REST API /wp-json/wp/v2 (JSON, không cần cookie).
// Bài viết chỉ có đoạn trích; truyện full là MỘT file .txt (UTF-8) trên Mega:
//   nút Tải -> redirect.html?url=<base64> (trang đếm ngược bọc shortener quảng cáo) -> base64 giải ra
//   https://link.sachiepvien.net/<id bài viết> -> 307 sang https://mega.nz/file/<handle>#<key>.
// File Mega mã hóa AES-128-CTR (key 32 byte: aesKey = k[0..15] ^ k[16..31], iv = k[16..23], counter = số khối 16 byte).
// AES bằng JS trong Rhino chỉ ~20-35 KB/s, nên tải + giải mã chạy trong WebView (crypto.subtle, TextDecoder native;
// API và CDN của Mega trả CORS *). Trang chạy bất đồng bộ rồi ghi kết quả JSON vào <pre id="vbout">.

var BASE = "https://sachiepvien.net";
var HEADERS = {
  "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36",
};
var DEFAULT_COVER = BASE + "/wp-content/uploads/2018/10/favicon2-300x300.png"; // bài viết không có ảnh bìa
// App chỉ tải trang sau khi cuộn tới cuối; trên tablet (Y700) 24 truyện vừa một màn hình, không cuộn được nên không tải thêm
var PER_PAGE = 60;
// Trang nhẹ, https (crypto.subtle cần secure context), cùng origin với API Mega.
// KHÔNG dùng "https://g.api.mega.co.nz/": redirect sang web app mega.nz, nặng tới mức làm treo engine.
var WEB_ORIGIN = "https://g.api.mega.co.nz/cs";

// GET REST API WordPress. path: "posts?search=abc". Trả { ok, status, data, totalPages } hoặc null nếu lỗi mạng.
function wpFetch(path) {
  var r = null;
  try { r = fetch(BASE + "/wp-json/wp/v2/" + path, { headers: HEADERS }); } catch (e) { r = null; }
  if (r == null) return null;
  var data = null;
  try { data = JSON.parse("" + r.text()); } catch (e2) { data = null; }
  var total = 0;
  try { total = parseInt("" + r.headers["x-wp-totalpages"], 10) || 0; } catch (e3) { total = 0; }
  return { ok: r.ok && data != null, status: r.status, data: data, totalPages: total };
}

// Tên bài (title.rendered) còn entity HTML: &#8211; &#8230; &amp;...
function decodeEntities(s) {
  return ("" + s).replace(/&#(\d+);/g, function (m, n) { return String.fromCharCode(parseInt(n, 10)); })
    .replace(/&#x([0-9a-f]+);/gi, function (m, n) { return String.fromCharCode(parseInt(n, 16)); })
    .replace(/&quot;/g, "\"").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").trim();
}

// Bài viết theo URL truyện https://sachiepvien.net/<slug>/ -> object REST (chỉ các field yêu cầu) hoặc chuỗi lỗi.
function findPost(url, fields) {
  var m = ("" + url).match(/sachiepvien\.net\/([^\/?#]+)/);
  if (!m) return "URL truyện không hợp lệ";
  var r = wpFetch("posts?slug=" + encodeURIComponent(decodeURIComponent(m[1])) + "&_fields=" + fields);
  if (r == null) return "Không kết nối được tới trang";
  if (!r.ok) return "Không tải được thông tin truyện (HTTP " + r.status + ")";
  if (r.data.length == 0) return "Không tìm thấy truyện";
  return r.data[0];
}

// Trên engine của app, Elements.first() KHÔNG trả về null khi rỗng -> luôn dùng hàm này.
function first(el, selector) {
  var els = el.select(selector);
  return els.size() > 0 ? els.get(0) : null;
}

// Mảng bài viết REST -> danh sách truyện cho app
function toList(posts) {
  var result = [];
  for (var i = 0; i < posts.length; i++) {
    var p = posts[i];
    result.push({
      name: decodeEntities(p.title.rendered),
      link: p.link,
      cover: DEFAULT_COVER,
      description: decodeEntities((p.excerpt ? p.excerpt.rendered : "").replace(/<[^>]+>/g, "").replace(/\s*\[&hellip;\]\s*$/, "")).substring(0, 200),
    });
  }
  return result;
}

// File Mega của một bài viết: { handle, key } hoặc null.
// App cũ (1.1.x): fetch tự theo redirect và response.url là URL cuối, giữ cả phần #key.
// App mới (CH Play): response.url vẫn là URL gốc và không có cách tắt redirect -> mở link trong WebView,
// chặn secureboot.js (web app mega.nz nặng) rồi đọc location.href.
function megaFile(postId) {
  var link = "https://link.sachiepvien.net/" + postId, url = "";
  try { url = "" + fetch(link, { headers: HEADERS }).url; } catch (e) { url = ""; }
  var m = url.match(MEGA_URL);
  if (!m) {
    var browser = Engine.newBrowser();
    try {
      if (typeof browser.block == "function") browser.block(["secureboot"]);
      browser.launch(link, 15000);
      browser.callJs("var p = document.createElement('pre'); p.id = 'vbhref'; p.textContent = location.href;" +
        " (document.body || document.documentElement).appendChild(p);", 300);
      var pre = first(browser.html(), "#vbhref");
      m = pre != null ? ("" + pre.text()).match(MEGA_URL) : null;
    } catch (e2) {
      m = null;
    } finally {
      browser.close();
    }
  }
  return m ? { handle: m[1], key: m[2] } : null;
}
var MEGA_URL = /mega\.nz\/file\/([^#?\/]+)#([A-Za-z0-9_-]{43})/;

// URL chương: https://link.sachiepvien.net/<id bài>?h=<handle>&k=<key>&a=<byte đầu>&b=<byte cuối + 1>
function chapterUrl(postId, file, a, b) {
  return "https://link.sachiepvien.net/" + postId + "?h=" + file.handle + "&k=" + file.key + "&a=" + a + "&b=" + b;
}

function parseChapterUrl(url) {
  var m = ("" + url).match(/[?&]h=([^&#]+)&k=([A-Za-z0-9_-]+)&a=(\d+)&b=(\d+)/);
  return m ? { handle: m[1], key: m[2], a: parseInt(m[3], 10), b: parseInt(m[4], 10) } : null;
}

// Thư viện chạy trong WebView. megaRead(handle, key, a, b) -> Promise { bytes (Uint8Array của [a, b)), size }.
var BROWSER_LIB = [
  "var MEGA_API = 'https://g.api.mega.co.nz/cs';",
  "function b64u(s) { s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '=';",
  "  var b = atob(s), a = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) a[i] = b.charCodeAt(i); return a; }",
  "function megaGet(h) {",
  "  return fetch(MEGA_API + '?id=' + Date.now(), { method: 'POST', body: JSON.stringify([{ a: 'g', g: 1, ssl: 1, p: h }]) })",
  "    .then(function (r) { return r.json(); }).then(function (j) {",
  "      var x = typeof j == 'number' ? j : j[0];",
  "      if (typeof x == 'number') throw new Error('Mega trả mã lỗi ' + x + (x == -9 || x == -16 ? ' (file đã bị xóa)' : ''));",
  "      return x; }); }",
  "function megaRead(h, k, a, b) {",
  "  return megaGet(h).then(function (info) {",
  "    if (b > info.s) b = info.s; var al = a - a % 16;",
  "    return fetch(info.g + '/' + al + '-' + (b - 1)).then(function (r) {",
  "      if (!r.ok) throw new Error('Mega HTTP ' + r.status); return r.arrayBuffer(); })",
  "    .then(function (buf) {",
  "      var kb = b64u(k), key = new Uint8Array(16), ctr = new Uint8Array(16), n = al / 16;",
  "      for (var i = 0; i < 16; i++) key[i] = kb[i] ^ kb[i + 16];",
  "      ctr.set(kb.subarray(16, 24), 0); for (var j = 15; j >= 8; j--) { ctr[j] = n % 256; n = Math.floor(n / 256); }",
  "      return crypto.subtle.importKey('raw', key, 'AES-CTR', false, ['decrypt'])",
  "        .then(function (ck) { return crypto.subtle.decrypt({ name: 'AES-CTR', counter: ctr, length: 64 }, ck, buf); })",
  "        .then(function (p) { return { bytes: new Uint8Array(p).subarray(a - al), size: info.s }; }); }); }); }",
  "function done(o) { var p = document.createElement('pre'); p.id = 'vbout'; p.textContent = JSON.stringify(o); document.body.appendChild(p); }",
].join("\n");

// Chạy `expr` (biểu thức JS trả về Promise của một object) trong WebView, chờ tối đa timeoutMs.
// Trả object kết quả, hoặc { error } nếu lỗi/quá giờ.
function webRun(expr, timeoutMs) {
  var browser = Engine.newBrowser();
  try {
    browser.launch(WEB_ORIGIN, 15000);
    browser.callJs(BROWSER_LIB + "\nPromise.resolve().then(function () { return " + expr + "; })" +
      ".then(done, function (e) { done({ error: '' + (e && e.message || e) }); });", 100);
    var start = Date.now();
    while (Date.now() - start < timeoutMs) {
      var out = first(browser.html(), "#vbout");
      if (out != null) return JSON.parse("" + out.text());
      sleep(200);
    }
    return { error: "Quá thời gian chờ tải file từ Mega" };
  } catch (e) {
    return { error: "" + e };
  } finally {
    browser.close();
  }
}

function jsString(s) {
  return "'" + ("" + s).replace(/\\/g, "\\\\").replace(/'/g, "\\'") + "'";
}
