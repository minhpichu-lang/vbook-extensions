// Thông tin truyện từ REST API (bài viết + các term qua _embed=wp:term).
// Nội dung bài: giới thiệu, sau đó "===========" và khối "Trích đoạn" (accordion) -> chỉ lấy phần giới thiệu.
load("site.js");

function execute(url) {
  var post = findPost(url, "id,link,title,content,modified,_links,_embedded&_embed=wp:term");
  if (typeof post == "string") return Response.error(post);

  var name = decodeEntities(post.title.rendered);
  var html = post.content.rendered;
  var cut = html.search(/<p>\s*={5,}|wpsm-accordion/);
  var doc = Html.parse(cut >= 0 ? html.substring(0, cut) : html);
  var paras = doc.select("p"), intro = [];
  for (var i = 0; i < paras.size(); i++) {
    var line = ("" + paras.get(i).text()).trim();
    if (line) intro.push(line);
  }
  var update = first(doc, "div.wpsm_update"); // vd "Text cũ 1-235 chương"

  var author = "", authorId = 0, genres = [], kinds = [];
  var groups = post._embedded && post._embedded["wp:term"] ? post._embedded["wp:term"] : [];
  for (var g = 0; g < groups.length; g++) {
    for (var j = 0; j < groups[g].length; j++) {
      var term = groups[g][j], title = decodeEntities(term.name);
      if (term.taxonomy == "tac_gia" && !author) { author = title; authorId = term.id; }
      else if (term.taxonomy == "post_tag") genres.push({ title: title, input: "posts?tags=" + term.id, script: "list.js" });
      else if (term.taxonomy == "dealstore") {
        kinds.push(title);
        genres.push({ title: title, input: "posts?dealstore=" + term.id, script: "list.js" });
      }
    }
  }

  var detail = [];
  if (author) detail.push("Tác giả: " + author);
  if (kinds.length) detail.push("Loại: " + kinds.join(", "));
  if (update != null) detail.push("Ghi chú: " + ("" + update.html()).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
  detail.push("Cập nhật: " + ("" + post.modified).replace("T", " "));

  return Response.success({
    name: name,
    cover: DEFAULT_COVER,
    host: BASE,
    author: author,
    description: intro.join("<br>"),
    detail: detail.join("<br>"), // app hiển thị detail dạng HTML, "\n" không xuống dòng
    ongoing: !/kết thúc|hoàn thành|hoàn tất|full|trọn bộ/i.test(name),
    genres: genres,
    suggests: authorId ? [{ title: "Cùng tác giả", input: "posts?tac_gia=" + authorId, script: "list.js" }] : [],
  });
}
