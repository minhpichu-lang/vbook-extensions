// Cấu hình tên miền dùng chung cho mọi script (nạp bằng load("site.js")).
//
// Domain chính: biến DOMAIN do người dùng đặt trong app, không có thì dùng mặc định bên dưới.
//   - vbook 1.1.x: cài đặt extension -> "Add code" -> gõ: let DOMAIN = "https://vinahentai.beer";
//   - vbook bản mới: ô "Tên miền" (khóa config DOMAIN trong plugin.json).
// Khi trang đổi tên miền (vd. .click -> .random), extension tự thích nghi theo thứ tự:
//   1. Redirect: nếu domain cũ chuyển hướng sang domain mới, lấy domain mới từ URL cuối của response.
//   2. REMOTE_DOMAIN_URL: file text từ xa (Gist/GitHub raw) chứa domain hiện tại, dòng đầu tiên.
//      Bạn chỉ cần sửa file đó, không cần cài lại extension.
//   3. FALLBACK_BASES: thử lần lượt các domain dự phòng.
// Chỉ khi domain chính không phải là trang truyện nữa (chết/404 không có nội dung) mới chạy bước 2, 3,
// nên bình thường không tốn thêm request nào.

var DEFAULT_BASE = configuredBase("https://vinahentai.beer");
var REMOTE_DOMAIN_URL = ""; // vd: "https://gist.githubusercontent.com/<user>/<id>/raw/domain.txt"
var FALLBACK_BASES = [
  "https://vinahentai.com",
  "https://vinahentai.net",
  "https://vinahentai.xyz",
  "https://vinahentai.top",
  "https://vinahentai.site",
  "https://vinahentai.pics",
  "https://vinahentai.beer",
];

var HEADERS = {
  "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36",
};

// Domain đang dùng trong lần chạy này (script chạy xong là mất, mỗi lần chạy sẽ dò lại nếu cần).
var BASE = DEFAULT_BASE;

// Tải một trang của site. `target` là path ("/danh-sach?page=2") hoặc URL đầy đủ
// (URL đầy đủ có thể mang domain cũ do app lưu từ trước -> chỉ lấy phần path).
// Trả về Response của app (có .ok, .status, .text(), .html()) hoặc null nếu mọi domain đều chết.
function siteFetch(target) {
  var path = toPath(target);
  var hint = originOf(target);

  // Thứ tự thử: domain mặc định (đã tính cả domain người dùng nhập trong app), rồi domain trong URL nhận vào
  var candidates = [DEFAULT_BASE];
  if (hint && hint != DEFAULT_BASE) candidates.push(hint);

  var r = tryBases(candidates, path);
  if (r != null) return r;

  // Domain chính không còn là trang truyện -> dò domain mới
  var discovered = [];
  var remote = readRemoteDomain();
  if (remote) discovered.push(remote);
  for (var i = 0; i < FALLBACK_BASES.length; i++) discovered.push(FALLBACK_BASES[i]);
  return tryBases(discovered, path);
}

function tryBases(bases, path) {
  var tried = {};
  for (var i = 0; i < bases.length; i++) {
    var base = bases[i];
    if (!base || tried[base]) continue;
    tried[base] = true;
    var r = null;
    try { r = fetch(base + path, { headers: HEADERS }); } catch (e) { r = null; }
    if (r == null) continue;
    var finalBase = originOf("" + r.url) || base;
    // Body của Response chỉ đọc được MỘT lần (gọi text() rồi thì html() trả null),
    // nên đọc ở đây và trả về wrapper giữ sẵn body cho script dùng lại.
    var body = "";
    try { body = "" + r.text(); } catch (e2) { body = ""; }
    if (looksLikeSite(r.status, body)) {
      BASE = finalBase; // cập nhật domain (kể cả khi vừa được redirect sang domain mới)
      return wrapResponse(r, body);
    }
  }
  return null;
}

function wrapResponse(r, body) {
  return {
    ok: r.ok,
    status: r.status,
    url: "" + r.url,
    text: function () { return body; },
    html: function () { return Html.parse(body); },
  };
}

// Trang thật luôn có link truyện hoặc CDN ảnh, kể cả trang 404 của site (vẫn có header/footer).
// Domain chết/parking trả về 404 hoặc nội dung không liên quan.
function looksLikeSite(status, body) {
  if (status == 404 && body.indexOf("truyen-hentai") < 0 && body.indexOf("vinahentai") < 0) return false;
  if (status >= 500) return false;
  return body.indexOf("truyen-hentai") >= 0 || body.indexOf("manga-posters") >= 0 || body.indexOf("vinahentai") >= 0;
}

function readRemoteDomain() {
  if (!REMOTE_DOMAIN_URL) return "";
  try {
    var r = fetch(REMOTE_DOMAIN_URL, { headers: HEADERS });
    if (!r.ok) return "";
    var line = ("" + r.text()).split("\n")[0].trim().replace(/\/+$/, "");
    if (line.indexOf("http") != 0) line = "https://" + line;
    return line;
  } catch (e) {
    return "";
  }
}

// Domain người dùng nhập trong cài đặt extension của app (khóa "DOMAIN" trong config của plugin.json,
// app tiêm vào thành hằng số DOMAIN). Tester/shim hoặc app bản cũ không có hằng này -> dùng `fallback`.
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

// Ghép link tương đối của site với domain hiện tại, đồng thời percent-encode ký tự Unicode:
// app gắn URL này vào header Referer khi tải ảnh, OkHttp không chấp nhận header ngoài ASCII.
function siteUrl(href) {
  var h = "" + href;
  if (h.indexOf("http") == 0) h = toPath(h);
  return encodeUnicode(BASE + h);
}

function encodeUnicode(u) {
  var out = "", run = "";
  for (var i = 0; i < u.length; i++) {
    if (u.charCodeAt(i) > 127) {
      run += u.charAt(i);
    } else {
      if (run) { out += encodeURIComponent(run); run = ""; }
      out += u.charAt(i);
    }
  }
  if (run) out += encodeURIComponent(run);
  return out;
}

// Trên engine của app, Elements.first() KHÔNG trả về null khi rỗng (trả về phần tử rỗng, text = "").
// Luôn dùng hàm này thay cho .select(x).first() để có null thật sự.
function first(el, selector) {
  var els = el.select(selector);
  return els.size() > 0 ? els.get(0) : null;
}
