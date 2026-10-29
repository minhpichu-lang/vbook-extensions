// Nội dung chương. url: https://sangtacviet.com/truyen/<host>/1/<bookid>/<cid>/
//
// Site chống bot bằng một "handshake" cookie trước khi trả nội dung (API: POST /index.php?...&sajax=readchapter):
//   1. GET trang chương: server cấp PHPSESSID rồi cấp _ac (lần đầu qua document.cookie trong HTML,
//      từ lần sau qua header Set-Cookie).
//   2. POST API kèm header X-Requested-With -> {"code":7} (bảo trình duyệt reload) + Set-Cookie _ac mới.
//   3. POST API KHÔNG gửi X-Requested-With -> {"code":"0","data":"<html>"}.
// Session đã "mở khóa" thì các chương sau chỉ cần bước 3, nên ở đây thử bước 3 trước, thất bại mới làm 1-2-3.
// App có cookie jar tự động (lưu Set-Cookie và gửi lại), mọi request đều dựa vào jar đó: KHÔNG tự đặt
// header Cookie, vì app gộp thêm vào cookie của jar thành cookie trùng tên và server từ chối (mã 4003).
// Bước 3 bắt buộc Content-Type form-urlencoded và body RỖNG, nếu không server trả về một chương ngẫu nhiên
// của cùng truyện (phát hiện qua trường `origin`: URL chương gốc phải chứa cid).
// Nội dung `data` là bản dịch máy: mỗi từ bọc trong <i h='hán việt' t='gốc' v='nghĩa'>từ</i>, đoạn ngắt bằng xuống dòng.
load("site.js");

// Giãn nhịp tải chương. Site giới hạn số chương đọc theo IP, vượt là bắt quét captcha (mã 21), và lần vi phạm
// sau bị khóa lâu hơn (đo 10/2026: lần 1 ~2 phút, lần 2 >25 phút). Đo trên điện thoại sau khi quét captcha:
// cách 3 s -> bị bắt ở chương thứ 8; cách 12 s -> chương thứ 10; cách 20 s -> 12 chương liên tiếp vẫn đọc được.
// Số liệu khớp với "token bucket" ~7 chương, hồi 1 chương mỗi 30-49 s (khi đó cách 20 s đều đặn sẽ bị bắt ở
// khoảng chương 13-17) hoặc với 2 cửa sổ trượt (<=7 chương/~1 phút và <=9 chương/~2-3 phút). Bucket phía client
// dưới đây an toàn với cả hai: tải liền tối đa CHAP_BURST chương (cách nhau CHAP_MIN_GAP_MS), sau đó mỗi
// CHAP_REFILL_MS hồi một lượt. Đọc bình thường (vài phút/chương) thì bucket luôn đầy, chương mở ra tải ngay.
// vbook gọi chap.js song song (tải trước chương, tải truyện) nên sleep riêng trong từng lần gọi không giãn được:
// các lần gọi dùng chung trạng thái bucket trong localStorage (lưu được giữa các lần gọi) và chờ tới lượt.
// Đặt CHAP_REFILL_MS = 0 để tắt.
var CHAP_BURST = 5;
var CHAP_REFILL_MS = 50000;
var CHAP_MIN_GAP_MS = 3000;

// Tên thay theo chữ gốc (thuộc tính t của từng từ). Dùng cho tên mà bản dịch máy ra cụm từ thường, không thay
// được bằng danh sách thay thế tên của vbook vì trùng nghĩa đen: 赤瞳 -> "mắt đỏ" (cả "hốc mắt đỏ lên"...).
// Một tên có thể bị tách thành vài từ liền nhau (和真说道 -> 和|真|说道), nên khớp cả chuỗi từ ghép lại, nhưng
// chỉ khi ranh giới từ trùng với tên: 我和真的不一样 -> 和|真的 không khớp 和真.
// Tên hay bị dính vào từ sau (博人说道 -> 博|人说道) thì thêm riêng dạng "<tên>说道".
// Không thêm tên mà chính chữ Trung cũng mơ hồ ở mức từ: 五条 (五条路 = năm con đường), 我妻 (= vợ tôi),
// 炼狱, 漩涡, 禅院, 大和 (大|和|小), 有马 (有|马), 日和, 一色, 和人.
var NAME_MAP = {
  // Naruto
  "佐助": "Sasuke",
  "小樱": "Sakura",
  "自来也": "Jiraiya",
  "自来也说道": "Jiraiya nói",
  "长门": "Nagato",
  "博人": "Boruto",
  "博人说道": "Boruto nói",
  // Konosuba
  "和真": "Kazuma",
  "芸芸": "Yunyun",
  // Toaru
  "上条": "Kamijou",
  "当麻": "Touma",
  // Date A Live
  "士道": "Shidou",
  // Re:Zero
  "昴": "Subaru",
  // Gotoubun no Hanayome
  "一花": "Ichika",
  "二乃": "Nino",
  // Jujutsu Kaisen
  "忧太": "Yuuta",
  "真依": "Mai",
  "家入": "Ieiri",
  // Suzumiya Haruhi
  "有希": "Yuki",
  // Conan
  "新一": "Shinichi",
  "新一说道": "Shinichi nói",
  // Reborn, Horimiya
  "京子": "Kyouko",
  // Classroom of the Elite
  "有栖": "Arisu",
  "一夏": "Ichika",
  "七濑": "Nanase",
  "神室": "Kamuro",
  // Bocchi the Rock
  "喜多": "Kita",
  "喜多说道": "Kita nói",
  // Seishun Buta Yarou
  "和香": "Nodoka",
  // Shingeki no Kyojin: bản dịch máy ra "Misaka" (trùng 御坂)
  "三笠": "Mikasa",
  // SAO / Gintama: cả hai đều dịch thành "Hướng ruộng"
  "朝田": "Asada",
  "冲田": "Okita",
  "冲田总悟": "Okita Sougo",
  // Boku no Hero Academia: bản dịch máy ra "Katsuki"
  "爆豪": "Bakugou",
  // Monogatari: bản dịch máy ra "Araragi Tsukihi"
  "阿良良木火怜": "Araragi Karen",
  "火怜": "Karen",
  // Slam Dunk: bản dịch máy bỏ mất họ
  "樱木花道": "Sakuragi Hanamichi",

  "风神": "Phong Thần",
  "风神符": "Phong Thần phù",
  // Đấu La (tên chung): bản dịch máy ra "Trữ Phong Trí", "bỏ dài"..., tên phiên âm đổi sang Hán Việt
  "宁风致": "Ninh Phong Trí",
  "舍长": "Xá trưởng",
  "雪夜大帝": "Tuyết Dạ Đại Đế",
  "雪夜": "Tuyết Dạ",
  "古榕": "Cổ Dung",
  "诺丁": "Nặc Đinh",
  "史莱克": "Sử Lai Khắc",
  "萨拉斯": "Tát Lạp Tư",
  "波塞西": "Ba Tái Tây",
  "塞西": "Tái Tây",
  // Akame ga Kill
  "赤瞳": "Akame",
  "黑瞳": "Kurome",
  "娜杰妲": "Najenda",
  "布拉特": "Bulat",
  "莱昂内": "Leone",
  "波尔斯": "Bols",
  "斯泰利修": "Stylish",
  "奥尼斯特": "Honest",
  "莎悠": "Sayo",
  "家康": "Ieyasu"
};

// Tên chỉ áp dụng cho một truyện (khóa "<nguồn>/<id truyện>" lấy từ URL), dùng cho chữ gốc là từ thông dụng
// ở truyện khác (小猫 = mèo con, 波波...). Được ưu tiên hơn NAME_MAP.
var BOOK_NAME_MAP = {
  // Đấu La: Ta Võ Hồn so điêu (斗罗：我武魂比雕)
  "qidian/1043962558": {
    "墨辉": "Mặc Huy",
    "墨辉点头": "Mặc Huy gật đầu",
    "墨辉点头道": "Mặc Huy gật đầu nói",
    "墨痕": "Mặc Ngân",
    "墨痕叔叔": "Mặc Ngân thúc thúc",
    "墨痕老师": "Mặc Ngân lão sư",
    "波波": "Pidgey",
    "比雕": "Pidgeot",
    "素云涛": "Tố Vân Đào",
    "风云帆": "Phong Vân Phàm",
    "无风青灵鸟": "Vô Phong Thanh Linh Điểu",
    "无风青灵": "Vô Phong Thanh Linh",
    "青灵鸟": "Thanh Linh Điểu"
  },
  // Đã nói xong thường ngày, ngươi lại linh khí hồi phục? (说好的日常，你却灵气复苏了？)
  "faloo/831559": {
    "小猫": "Koneko",
    "惠酱": "Megumi-chan",
    "莱萨": "Riser",
    "苍那": "Sona",
    "夏音": "Kanon",
    "阿修特尔": "Artosh",
    "夏世": "Hạ Thế",
    "阎萝": "Diêm La"
  },
  // Tận thế: Bắt đầu lựa chọn Busujima Saeko. Gói name chia phiếu cho tên main 方南 (Sanzhi Minami/Phương Nam/
  // Yonan/Fang Nan); server hay tách tên dính vào từ sau: 方|南安|排在了 (安排 = sắp xếp), 方|南面|色 (面色 = sắc mặt)
  "faloo/848817": {
    "方南": "Minami",
    "方南安排": "Minami sắp xếp",
    "方南安排在了": "Minami sắp xếp",
    "方南面色": "Minami sắc mặt",
    "方南面前": "trước mặt Minami",
    "方南边让": "Minami bảo",
    "小孝": "Takashi",
    // Tên chỉ có trong 1 gói (dưới ngưỡng NAME_PACK_MIN_SHARE)
    "宫本贵理子": "Miyamoto Kiriko",
    "希里爱丽丝": "Maresato Alice",
    "南里香": "Minami Rika",
    "鞠川": "Marikawa"
  }
};

// Gói name theo fandom ("Tải name đặc biệt" trên web) áp dụng cho truyện: "<nguồn>/<id truyện>": [id gói, ...],
// gói đứng trước được ưu tiên. Tìm id gói: https://sangtacviet.com/io/namepack/query?q=<tên fandom> (JSON, trường
// id, name, downloadnum, content), vd 34 = Akame ga Kill, 4037 = Naruto/Boruto. Gói fandom không gắn với truyện
// nên chỉ lấy tên >= 2 chữ (bỏ "$兰=Ran"...) và đứng sau BOOK_NAME_MAP, name mặc định và gói name của truyện.
var BOOK_PACKS = {
  // "faloo/123456": [34]
};

function execute(url) {
  var info = parseBookUrl(url);
  if (info == null || !info.cid) return Response.error("URL chương không đúng dạng /truyen/<nguồn>/1/<id>/<chương>/");
  waitForTurn();

  var pageUrl = chapterUrl(info.host, info.bookid, info.cid);
  var api = "/index.php?bookid=" + info.bookid + "&h=" + info.host + "&c=" + info.cid + "&ngmar=readc&sajax=readchapter&sty=1&exts=";

  // Session đã mở khóa: chỉ cần bước 3
  var json = readChapter(api, pageUrl, info.cid);

  // Chưa mở khóa: làm đủ handshake, thử lại vài lần vì server thỉnh thoảng đòi reload thêm
  for (var attempt = 0; attempt < 3 && (json == null || json.retry); attempt++) {
    if (attempt > 0) sleep(1000);
    // Bước 1. Session mới: _ac nằm trong HTML (jar không lưu) -> tải lại lần nữa để nhận _ac qua Set-Cookie
    for (var i = 0; i < 2; i++) {
      var page = siteFetch(pageUrl);
      if (page == null) return Response.error("Không kết nối được tới trang");
      if (!page.ok) return Response.error("Không tải được trang chương (HTTP " + page.status + ")");
      if (("" + page.headers["set-cookie"]).indexOf("_ac=") >= 0) break;
    }
    // Bước 2
    if (postApi(api, pageUrl, true) == null) return Response.error("Không kết nối được tới trang");
    // Bước 3
    json = readChapter(api, pageUrl, info.cid);
  }
  if (json == null) return Response.error("Không kết nối được tới trang");
  if (json.retry) return Response.error(json.retry + ", thử lại sau");

  var code = "" + json.code;
  if (code != "0") {
    var msg = json.err || json.info || "";
    if (code == "12" || code == "13") return Response.error("Chương này cần đăng nhập trên sangtacviet.com" + (msg ? ": " + msg : ""));
    // Captcha mở khóa theo IP: quét bằng Chrome (cùng mạng) là vbook đọc lại được. WebView trong vbook
    // không qua được reCAPTCHA của Google nên không dùng được.
    if (code == "21") return Response.error("Sangtacviet yêu cầu quét captcha: mở sangtacviet.com bằng Chrome trên điện thoại (cùng mạng Wi-Fi/4G), quét xong quay lại đọc tiếp");
    return Response.error(msg ? "" + msg : "Không tải được chương (mã " + code + ")");
  }
  if (json.isComic) return Response.error("Extension này chưa hỗ trợ truyện tranh");
  var data = "" + (json.data || "");
  // Truyện sáng tác (host "sangtac") được bảo vệ bằng font riêng: chữ cái thay bằng ký tự Private Use Area,
  // chỉ hiển thị đúng với font của site -> không đọc được ngoài web
  if (/[\uE000-\uF8FF]/.test(data)) return Response.error("Nội dung được mã hóa bằng font riêng của site (truyện sáng tác), extension chưa hỗ trợ");

  // defaultname: name mặc định chủ truyện/admin đặt cho truyện (web áp dụng phía trình duyệt), cùng định dạng gói name
  var defaults = parseNameText("" + (json.defaultname || ""), 1);
  var content = renderContent(data, info.host, info.bookid, loadNamePack(info.host, info.bookid), defaults, loadBookPacks(info.host, info.bookid));
  if (!content) return Response.error("Chương không có nội dung (nguồn gốc bị khóa hoặc trống)");
  return Response.success(content);
}

// Gói name người đọc đăng cho truyện (mục "Tải name" trên web): GET /namesys.php?host=&book= trả về các <tr>,
// mỗi gói nằm trong một <div>, mới nhất trước. Dòng "$中文=Tên" (hoặc "#") là tên theo chữ gốc; "@chữ việt=Chữ Việt"
// thay trên bản dịch (thường là sửa viết hoa). Web áp dụng các gói này phía trình duyệt, API đọc chương thì không.
// Gói do từng người đăng nên có mục sai/theo sở thích riêng (vd một gói đổi 伊澄同学 thành tên nhân vật khác,
// một gói viết hoa 世界 = "Thế Giới"), còn tên chính thì hầu hết các gói giống nhau (墨辉=Mặc Huy ở 46/48 gói):
// chỉ lấy mục có trong ít nhất NAME_PACK_MIN_SHARE số gói (tối thiểu 2 gói khi có từ 3 gói), giá trị được nhiều
// gói chọn nhất (hòa thì lấy gói mới hơn). Kết quả lưu localStorage NAME_PACK_TTL_MS để không tải lại (~400 KB).
var NAME_PACK_TTL_MS = 3 * 24 * 3600 * 1000;
var NAME_PACK_MIN_SHARE = 0.25;

function loadNamePack(host, bookid) {
  var key = "namepack:" + host + "/" + bookid;
  var cached = null;
  try { cached = JSON.parse("" + localStorage.getItem(key)); } catch (e) { cached = null; }
  // Truyện chưa có gói nào thì không dùng cache (tải lại rẻ, response rỗng) để nhận gói mới đăng
  if (cached && cached.packs > 0 && Date.now() - cached.time < NAME_PACK_TTL_MS) return cached;

  var r = siteFetch("/namesys.php?host=" + host + "&book=" + bookid);
  if (r == null || !r.ok) return cached || { names: {}, words: [] };
  var html = "" + r.text();
  var packs = [], re = /<div[^>]*>([\s\S]*?)<\/div>/g, m;
  while ((m = re.exec(html)) != null) packs.push(m[1]);
  // Site lấy một số truyện về 2 lần từ cùng nguồn, cùng id (trxs/12188 và trxs2/12188): gói name thường chỉ
  // được đăng ở bản đầu -> bản "<nguồn>2" không có gói nào thì lấy gói của "<nguồn>"
  var base = /^(.*[a-z])2$/.exec(host);
  if (packs.length == 0 && base) {
    r = siteFetch("/namesys.php?host=" + base[1] + "&book=" + bookid);
    if (r != null && r.ok) {
      html = "" + r.text();
      while ((m = re.exec(html)) != null) packs.push(m[1]);
    }
  }

  // votes["$" + chữ gốc | "@" + chữ việt] = { packs: số gói có mục này, values: { giá trị: số phiếu } }
  var votes = {};
  for (var i = packs.length - 1; i >= 0; i--) {
    var lines = decodeEntities(packs[i]).split("\n"), seen = {};
    for (var j = 0; j < lines.length; j++) {
      var line = lines[j].trim(), eq = line.indexOf("=");
      if (eq < 2) continue;
      var type = line.charAt(0), src = line.substring(1, eq), dst = line.substring(eq + 1).trim(), vk;
      // Bỏ dòng rác: tên rỗng/quá dài, chữ gốc lẫn dấu câu ("苍那......=Souna")
      if (!dst || dst.length > 40) continue;
      if ((type == "$" || type == "#") && /^[\u3400-\u9FFF]+$/.test(src)) vk = "$" + src;
      else if (type == "@") { vk = "@" + src.split("|").join(" "); dst = dst.split("|").join(" "); }
      else continue;
      if (seen[vk]) continue;
      seen[vk] = true;
      var v = votes[vk] || (votes[vk] = { packs: 0, values: {} });
      v.packs++;
      v.values[dst] = (v.values[dst] || 0) + 1;
    }
  }
  var minPacks = packs.length < 3 ? 1 : Math.max(2, Math.ceil(packs.length * NAME_PACK_MIN_SHARE));
  var pack = { time: Date.now(), packs: packs.length, names: {}, words: [] };
  for (var k in votes) {
    if (!votes.hasOwnProperty(k) || votes[k].packs < minPacks) continue;
    // Duyệt gói cũ -> mới nên giá trị gặp sau (gói mới hơn) thắng khi hòa phiếu
    var best = null, bestVotes = 0;
    for (var val in votes[k].values) if (votes[k].values.hasOwnProperty(val) && votes[k].values[val] >= bestVotes) { best = val; bestVotes = votes[k].values[val]; }
    if (k.charAt(0) == "$") pack.names[k.substring(1)] = best;
    else if (k.substring(1) != best) pack.words.push([k.substring(1), best]);
  }
  pack.words.sort(function (a, b) { return b[0].length - a[0].length; });
  try { localStorage.setItem(key, JSON.stringify(pack)); } catch (e) {}
  return pack;
}

// Đọc một gói name dạng văn bản (defaultname, gói fandom): "$中文=Tên", "#中文=Tên", "中文=Tên" (gói cũ không có
// tiền tố) và "@chữ|việt=Chữ|Việt". Mục gặp trước thắng. minLen: số chữ Trung tối thiểu của một tên.
function parseNameText(text, minLen) {
  var out = { names: {}, words: [] }, seen = {};
  var lines = text.split("\n");
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].trim(), eq = line.indexOf("=");
    if (eq < 1) continue;
    var type = line.charAt(0), src = line.substring(0, eq), dst = line.substring(eq + 1).trim();
    if (type == "$" || type == "#" || type == "@") src = src.substring(1);
    if (!dst || dst.length > 40) continue;
    if (type == "@") {
      src = src.split("|").join(" ");
      dst = dst.split("|").join(" ");
      if (src && src != dst && !seen[src]) { seen[src] = true; out.words.push([src, dst]); }
    } else if (src.length >= minLen && /^[㐀-鿿]+$/.test(src) && !out.names.hasOwnProperty(src)) {
      out.names[src] = dst;
    }
  }
  out.words.sort(function (a, b) { return b[0].length - a[0].length; });
  return out;
}

// Các gói fandom của truyện (BOOK_PACKS), gộp lại theo thứ tự ưu tiên. Mỗi gói (vài KB) cache localStorage
// FANDOM_PACK_TTL_MS; tải lỗi thì dùng cache cũ.
var FANDOM_PACK_TTL_MS = 7 * 24 * 3600 * 1000;

function loadBookPacks(host, bookid) {
  var ids = BOOK_PACKS[host + "/" + bookid] || [], text = "";
  for (var i = 0; i < ids.length; i++) {
    var key = "fandompack:" + ids[i], cached = null;
    try { cached = JSON.parse("" + localStorage.getItem(key)); } catch (e) { cached = null; }
    if (!cached || Date.now() - cached.time >= FANDOM_PACK_TTL_MS) {
      var t = downloadPack(ids[i]);
      if (t != null) {
        cached = { time: Date.now(), text: t };
        try { localStorage.setItem(key, JSON.stringify(cached)); } catch (e) {}
      }
    }
    if (cached) text += cached.text + "\n";
  }
  return parseNameText(text, 2);
}

// Nội dung gói name theo id (web: nút "Tải" trong "Gói Name Đặc Biệt"), không cần cookie. Trả về null nếu lỗi.
function downloadPack(id) {
  var headers = { "Content-Type": "application/x-www-form-urlencoded", Referer: BASE + "/" };
  for (var k in HEADERS) headers[k] = HEADERS[k];
  try {
    var r = fetch(BASE + "/index.php?ngmar=downcust", { method: "POST", headers: headers, body: { ajax: "downcustomname", packid: "" + id } });
    if (!r.ok) return null;
    var t = "" + r.text();
    return t == "error" ? null : t;
  } catch (e) {
    return null;
  }
}

// Giữ một lượt tải chương theo bucket rồi chờ tới lượt đó. Trạng thái: tat = thời điểm bucket đầy lại nếu
// không ai tải thêm (mỗi lượt cộng CHAP_REFILL_MS), last = lượt gần nhất. Lượt mới được bắt đầu khi bucket
// còn chỗ (tat - now <= (CHAP_BURST - 1) * CHAP_REFILL_MS) và cách lượt trước CHAP_MIN_GAP_MS.
function waitForTurn() {
  if (CHAP_REFILL_MS <= 0) return;
  // getItem/setItem không nguyên tử: lệch ngẫu nhiên để các lần gọi song song không đọc cùng một trạng thái
  sleep(Math.floor(Math.random() * 500));
  var now = Date.now(), st = null;
  try { st = JSON.parse("" + localStorage.getItem("chap_bucket")); } catch (e) { st = null; }
  var tat = st && st.tat > now ? st.tat : now;
  var turn = Math.max(now, tat - (CHAP_BURST - 1) * CHAP_REFILL_MS, (st && st.last || 0) + CHAP_MIN_GAP_MS);
  localStorage.setItem("chap_bucket", JSON.stringify({ tat: tat + CHAP_REFILL_MS, last: turn }));
  if (turn > now) sleep(turn - now);
}

// Bước 3. Trả về JSON của server; {retry: "<lý do>"} nếu cần làm lại handshake; null nếu không kết nối được.
function readChapter(api, pageUrl, cid) {
  var r = postApi(api, pageUrl, false);
  if (r == null) return null;
  var text = ("" + r.text()).trim();
  var json = null;
  try { json = JSON.parse(text.substring(text.indexOf("{"))); } catch (e) { json = null; }
  if (json == null) return { retry: "Server trả về dữ liệu không đọc được: " + text.substring(0, 120) };
  var code = "" + json.code;
  if (code == "7") return { retry: "Server liên tục yêu cầu tải lại (chống bot)" };
  // Mã 5 kèm "mã báo lỗi 40xx" = session chưa hợp lệ -> handshake lại
  if (code == "5" && /40\d\d/.test("" + json.err)) return { retry: "" + json.err };
  if (isPoisoned(json, cid)) return { retry: "Server trả về sai chương (chống bot)" };
  return json;
}

function postApi(api, referer, xhr) {
  var headers = { "Content-Type": "application/x-www-form-urlencoded", Referer: referer };
  if (xhr) headers["X-Requested-With"] = "XmlHttpRequest";
  for (var k in HEADERS) headers[k] = HEADERS[k];
  try {
    // body {} -> form rỗng, Content-Length: 0 (đã kiểm tra trên engine của app)
    return fetch(BASE + api, { method: "POST", headers: headers, body: {} });
  } catch (e) {
    return null;
  }
}

// Phản hồi đúng có origin = URL chương ở nguồn gốc (chứa cid), vd https://m.qidian.com/book/<bookid>/<cid>.html.
// Nguồn không có origin (dich, sangtac) thì không kiểm tra được.
function isPoisoned(json, cid) {
  var origin = "" + (json.origin || "");
  return origin.length > 5 && origin.indexOf(cid) < 0;
}

// Chuyển HTML dịch máy của site thành HTML sạch: mỗi đoạn một <p>.
function renderContent(data, host, bookid, pack, defaults, fandom) {
  var none = { names: {}, words: [] };
  if (!pack) pack = none;
  if (!defaults) defaults = none;
  if (!fandom) fandom = none;
  var words = defaults.words.concat(pack.words, fandom.words);
  words.sort(function (a, b) { return b[0].length - a[0].length; });
  var s = data;
  if (s.indexOf("chat-") >= 0) return s; // truyện dạng "chat", giữ nguyên HTML của site
  // Ghi chú của site ở đầu chương (span chữ xám): "@Bạn đang đọc bản lưu trong hệ thống", "Đọc tại sangtacviet.com",
  // "Tải ảnh: 0.062s Scan: 3.699s"
  s = s.replace(/<span[^>]*color:\s*gray[^>]*>[^<]*<\/span>/g, "");
  // Truyện tự dịch: dấu < trong văn bản không phải thẻ (site cũng escape như vậy)
  if (host == "dich") s = s.replace(/<(?=[^i\/])/g, "&lt;");
  if (host == "ciweimao") s = s.replace(/<span>[\s\S]*?<\/span>/g, "");
  // Bỏ lớp bọc <i ...>từ</i>, giữ nghĩa đã dịch (hoặc tên nếu chữ gốc của vài từ liền nhau khớp)
  var maps = [BOOK_NAME_MAP[host + "/" + bookid] || {}, defaults.names, pack.names, fandom.names, NAME_MAP];
  var pending = [];
  s = s.replace(/<i(?:\s[^>]*)?>[\s\S]*?<\/i>(?:[ \t]*<i(?:\s[^>]*)?>[\s\S]*?<\/i>)*/g, function (run) {
    return replaceNames(run, maps, pending);
  });
  if (pending.length > 0) s = fillSplitNames(s, pending);
  // Ngắt đoạn
  s = s.replace(/<\/p>\s*<p[^>]*>/g, "\n").replace(/<br\s*\/?>/gi, "\n").replace(/<\/?p[^>]*>/g, "\n");
  // Giữ lại ảnh, bỏ mọi thẻ khác
  var imgs = [];
  s = s.replace(/<img[^>]*\ssrc=["']([^"']+)["'][^>]*>/gi, function (m, src) {
    // CDN ảnh của ciweimao chặn Referer lạ (403 "denied by Referer ACL"), mà vbook tải ảnh kèm Referer là URL
    // chương sangtacviet (web thì dùng referrerpolicy=no-referrer) -> lấy qua proxy ảnh Photon
    src = src.replace(/^https?:\/\/([^\/]*kuangxiangit\.com\/)/, "https://i0.wp.com/$1");
    imgs.push(src);
    return "@@IMG" + (imgs.length - 1) + "@@";
  });
  s = s.replace(/<[^>]+>/g, "");

  var lines = s.split(/\r?\n/);
  var out = [];
  for (var i = 0; i < lines.length; i++) {
    var line = cleanJunk(lines[i].replace(/\s+/g, " ").trim());
    if (!line) continue;
    line = replaceWords(line, words);
    line = line.replace(/@@IMG(\d+)@@/g, function (m, idx) {
      return "<img src=\"" + imgs[parseInt(idx, 10)] + "\">";
    });
    out.push("<p>" + line + "</p>");
  }
  return out.join("\n");
}

// Một dãy từ <i> liền nhau -> văn bản, thay các nhóm 1-6 từ có chữ gốc ghép lại trùng một tên.
// maps: các bảng tên theo thứ tự ưu tiên (BOOK_NAME_MAP của truyện, defaultname, gói name của truyện, gói fandom,
// NAME_MAP).
// pending: nhận các chỗ tên bị cắt dính vào từ sau, thay tạm bằng @@TR<n>@@ (xem fillSplitNames).
function replaceNames(run, maps, pending) {
  var tokens = [];
  var re = /([ \t]*)<i(\s[^>]*)?>([\s\S]*?)<\/i>/g, m;
  while ((m = re.exec(run)) != null) {
    var t = /(?:^|[\s'"])t=['"]([^'"]*)['"]/.exec(m[2] || "");
    tokens.push({ sep: m[1], t: t ? t[1] : "", text: m[3] });
  }
  var out = "";
  for (var i = 0; i < tokens.length; ) {
    var hit = matchName(tokens, i, maps);
    if (hit != null) {
      out += tokens[i].sep + hit.name;
      i += hit.k;
      continue;
    }
    // Server tách tên dính vào từ sau: 方南无语 -> 方|南无|语 ("phương nam mô ngữ", 南无 = nam mô),
    // 方南松了口气 -> 方|南松|... ("Phương Nam Tùng"). Chỉ xét tên riêng của truyện (BOOK_NAME_MAP, defaultname,
    // gói name): tên chung như 和真 thì 我和真的 -> 和|真的 là tách đúng. Phần dư của từ bị cắt ghép với từ sau rồi dịch lại.
    hit = matchSplitName(tokens, i, [maps[0], maps[1], maps[2]]);
    if (hit != null) {
      var j = i + hit.k, fallback = tokens[i].text;
      for (var x = i + 1; x < j; x++) fallback += tokens[x].sep + tokens[x].text;
      var text = hit.rest;
      if (j < tokens.length && tokens[j].t && matchName(tokens, j, maps) == null) {
        text += tokens[j].t;
        fallback += tokens[j].sep + tokens[j].text;
        j++;
      }
      pending.push({ name: hit.name, text: text, fallback: fallback });
      out += tokens[i].sep + "@@TR" + (pending.length - 1) + "@@";
      i = j;
      continue;
    }
    out += tokens[i].sep + tokens[i].text;
    i++;
  }
  return out;
}

// Nhóm 1-6 từ bắt đầu ở tokens[i] có chữ gốc ghép lại trùng một tên -> { k: số từ, name }.
function matchName(tokens, i, maps) {
  for (var k = Math.min(6, tokens.length - i); k > 0; k--) {
    var key = "";
    for (var j = i; j < i + k; j++) key += tokens[j].t;
    for (var n = 0; key && n < maps.length; n++) if (maps[n].hasOwnProperty(key)) return { k: k, name: maps[n][key] };
  }
  return null;
}

// Tên bắt đầu ở tokens[i] nhưng kết thúc giữa từ cuối của nhóm >= 2 từ -> { k, name, rest: chữ gốc còn dư }.
// Tên nằm gọn ở đầu một từ (鞠川老师 = "Marikawa-sensei") là server đã nhận đúng cả cụm, không tách.
function matchSplitName(tokens, i, maps) {
  for (var k = Math.min(6, tokens.length - i); k > 1; k--) {
    var prefix = "";
    for (var j = i; j < i + k - 1; j++) prefix += tokens[j].t;
    var last = tokens[i + k - 1].t;
    for (var c = last.length - 1; c > 0; c--) {
      var key = prefix + last.substring(0, c);
      if (key.length < 2) continue;
      for (var n = 0; n < maps.length; n++) if (maps[n].hasOwnProperty(key)) return { k: k, name: maps[n][key], rest: last.substring(c) };
    }
  }
  return null;
}

// Dịch lại phần dư sau tên bị cắt (无 + 语 -> 无语 = "im lặng") bằng API dịch của site, một request cho cả chương.
// Lỗi thì giữ nguyên bản dịch cũ của cả cụm.
function fillSplitNames(s, pending) {
  var texts = [];
  for (var i = 0; i < pending.length; i++) texts.push(pending[i].text);
  var tr = translate(texts);
  return s.replace(/@@TR(\d+)@@/g, function (m, idx) {
    var p = pending[parseInt(idx, 10)], t = tr ? tr[parseInt(idx, 10)] : "";
    if (!t) return p.fallback;
    // API viết hoa chữ đầu như đầu câu
    return p.name + " " + t.charAt(0).toLowerCase() + t.substring(1);
  });
}

// API dịch máy của site (web dùng khi người đọc chọn cụm từ): các đoạn nối bằng <split>, trả về đúng thứ tự.
// Trả về null nếu lỗi.
function translate(texts) {
  var headers = { "Content-Type": "application/x-www-form-urlencoded", Referer: BASE + "/" };
  for (var k in HEADERS) headers[k] = HEADERS[k];
  try {
    var r = fetch(BASE + "/index.php", { method: "POST", headers: headers, body: { sajax: "trans", ngmar: "trans", content: texts.join("<split>") } });
    if (!r.ok) return null;
    var out = ("" + r.text()).split("<split>");
    if (out.length != texts.length) return null;
    for (var i = 0; i < out.length; i++) out[i] = out[i].trim();
    return out;
  } catch (e) {
    return null;
  }
}

// Bỏ ký hiệu ngăn cảnh mà trình đọc audio đọc lên thành tiếng ồn. Trả về "" nếu cả đoạn là rác:
// - đoạn không có chữ/số ("............, .............., .", "-----"), trừ lời thoại im lặng có ngoặc kép ("“……”");
// - quảng cáo cuối chương của faloo ("Phi lô nhắc nhở ngài: ...", "... (b.faloo.com bản gốc tác phẩm ...",
//   "Nhìn không phía dưới phác họa bản tiểu thuyết thỉnh download phi lô tiểu thuyết APP!");
// - lời tác giả xin phiếu: cả đoạn trong ngoặc có nhắc tới phiếu/hoa tươi/thưởng ("( Cầu hoa tươi, cầu nguyệt phiếu,
//   cầu Thanks.)", "( ... Nguyệt phiếu sao??)"), hoặc đoạn chỉ gồm các câu "cầu ..." ("Cầu hoa tươi, cầu nguyệt phiếu!").
// Trong đoạn có chữ: chuỗi >= 4 ký hiệu giống nhau ("-----", "=====") bị xóa, chuỗi chấm dài rút thành "…".
var BEG_RE = /cầu\s*(?:hoa tươi|nguyệt phiếu|vé tháng|phiếu đề cử|đề cử phiếu|đề cử|phiếu|cất giữ|khen thưởng|đánh thưởng|đặt mua|bình luận|truy đọc|ủng hộ|thanks)/gi;
var BEG_WORD_RE = /hoa tươi|nguyệt phiếu|vé tháng|phiếu đề cử|khen thưởng|đánh thưởng|đặt mua|cất giữ|thanks/i;

function cleanJunk(line) {
  // U+FFFD: ký tự hỏng mã hóa từ nguồn (vd "APP!\uFFFD\uFFFD"), không mang nghĩa
  line = line.replace(/\uFFFD/g, "").trim();
  if (/faloo\.com|^Phi lô nhắc nhở|phi lô tiểu thuyết APP/i.test(line)) return "";
  if (/^[(（][\s\S]*[)）][\s_]*$/.test(line) && BEG_WORD_RE.test(line)) return "";
  var rest = line.replace(BEG_RE, "");
  if (rest != line && !/[0-9A-Za-z\u00C0-\u024F\u1E00-\u1EFF]/.test(rest)) return "";
  if (!/[0-9A-Za-z\u00C0-\u024F\u1E00-\u1EFF]/.test(line) && !/[“”"「」『』]/.test(line)) return "";
  return line.replace(/([-_=~*#·•—])\1{3,}/g, " ").replace(/(?:\.|…){4,}/g, "…").replace(/\s+/g, " ").trim();
}

// Thay các cụm chữ Việt ("@" trong gói name) khi đứng thành từ riêng: "ác ma" không khớp trong "các ma".
function replaceWords(line, words) {
  for (var i = 0; i < words.length; i++) {
    var from = words[i][0], to = words[i][1], pos = 0, idx;
    while ((idx = line.indexOf(from, pos)) >= 0) {
      var end = idx + from.length;
      if (isWordChar(line.charAt(idx - 1)) || isWordChar(line.charAt(end))) {
        pos = idx + 1;
        continue;
      }
      line = line.substring(0, idx) + to + line.substring(end);
      pos = idx + to.length;
    }
  }
  return line;
}

function isWordChar(c) {
  return c !== "" && /[0-9A-Za-z\u00C0-\u024F\u1E00-\u1EFF]/.test(c);
}
