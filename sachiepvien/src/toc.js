// Mục lục: tải cả file .txt trên Mega trong WebView (33 MB ~15 s trên Samsung A04), tách chương theo dòng tiêu đề
// ("Thứ N chương …", "Chương N: …", "Phiên ngoại …") và trả vị trí byte [a, b) của từng chương trong URL chương.
// Kết quả lưu localStorage theo handle Mega: file được cập nhật thì link Mega đổi -> quét lại.
load("site.js");

// Chạy trong WebView: x = { bytes, size } của cả file -> { chapters: [[tên, a, b], ...] }
var SCAN = [
  "function (x) {",
  "  var by = x.bytes, n = by.length, d = new TextDecoder(), heads = [], ls = 0;",
  "  var HEAD = /^(thứ\\s*\\d+\\s*chương|chương\\s*\\d+|đệ\\s*\\d+\\s*chương|phiên ngoại|ngoại truyện|第\\s*\\d+\\s*章)/i;",
  "  var MIN = 300, MAX = 250 * 1024, PART = 100 * 1024;", // MAX: một số truyện ~300 KB/chương; PART: file không có tiêu đề
  "  for (var i = 0; i <= n; i++) {",
  "    if (i < n && by[i] != 10) continue;",
  "    if (i - ls < 400) { var s = d.decode(by.subarray(ls, i)).replace(/\\s+/g, ' ').trim(); if (s.length <= 120 && HEAD.test(s)) heads.push([ls, s]); }",
  "    ls = i + 1;",
  "  }",
  // Tiêu đề mà nội dung ngắn hơn MIN (mục lục liệt kê ở đầu file...) không mở chương mới
  "  var marks = heads.filter(function (h, j) { return (j + 1 < heads.length ? heads[j + 1][0] : n) - h[0] >= MIN; });",
  "  function nextLine(p) { while (p < n && by[p] != 10) p++; return p < n ? p + 1 : n; }",
  "  function push(out, name, a, b, size) {",
  "    for (var p = a, k = 1; p < b; k++) { var e = p + size >= b ? b : Math.min(nextLine(p + size), b);",
  "      out.push([b - a > size ? name + ' (' + k + ')' : name, p, e]); p = e; } }",
  "  var out = [];",
  "  if (marks.length < 2) { push(out, 'Phần', 0, n, PART); out.forEach(function (c, j) { c[0] = 'Phần ' + (j + 1); }); return { chapters: out }; }",
  "  if (marks[0][0] > 0) push(out, 'Mở đầu', 0, marks[0][0], MAX);",
  "  for (var j = 0; j < marks.length; j++) push(out, marks[j][1], marks[j][0], j + 1 < marks.length ? marks[j + 1][0] : n, MAX);",
  "  return { chapters: out };",
  "}",
].join("\n");

function execute(url) {
  var post = findPost(url, "id");
  if (typeof post == "string") return Response.error(post);
  var file = megaFile(post.id);
  if (file == null) return Response.error("Không lấy được link Mega của truyện");

  var cacheKey = "toc_" + file.handle, chapters = null;
  try { chapters = JSON.parse("" + localStorage.getItem(cacheKey)); } catch (e) { chapters = null; }
  if (!chapters || !chapters.length) {
    var res = webRun("megaRead(" + jsString(file.handle) + ", " + jsString(file.key) + ", 0, 1e15).then(" + SCAN + ")", 170000);
    if (res.error) return Response.error(res.error);
    chapters = res.chapters;
    try { localStorage.setItem(cacheKey, JSON.stringify(chapters)); } catch (e2) { }
  }

  var result = [];
  for (var i = 0; i < chapters.length; i++) {
    var c = chapters[i];
    result.push({ name: c[0], url: chapterUrl(post.id, file, c[1], c[2]) });
  }
  return Response.success(result);
}
