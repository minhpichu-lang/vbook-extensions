// Nội dung chương: URL do toc.js tạo mang sẵn file Mega (h, k) và đoạn byte [a, b) -> tải + giải mã đúng đoạn đó
// trong WebView, mỗi dòng không rỗng thành một <p>.
load("site.js");

var TO_HTML = [
  "function (x) {",
  "  var lines = new TextDecoder().decode(x.bytes).split(/\\r?\\n/), out = [];",
  "  for (var i = 0; i < lines.length; i++) {",
  "    var s = lines[i].trim();",
  "    if (s) out.push('<p>' + s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</p>');",
  "  }",
  "  return { html: out.join('') };",
  "}",
].join("\n");

function execute(url) {
  var q = parseChapterUrl(url);
  if (q == null) return Response.error("URL chương không hợp lệ, hãy tải lại mục lục");
  var res = webRun("megaRead(" + jsString(q.handle) + ", " + jsString(q.key) + ", " + q.a + ", " + q.b + ").then(" + TO_HTML + ")", 60000);
  if (res.error) return Response.error(res.error);
  return Response.success(res.html);
}
