// Thể loại = 10 category của E-Hentai (mỗi category có trang riêng /<slug>) + vài ngôn ngữ hay dùng.
function execute() {
  var cats = [
    ["Doujinshi", "/doujinshi"], ["Manga", "/manga"], ["Artist CG", "/artistcg"], ["Game CG", "/gamecg"],
    ["Western", "/western"], ["Non-H", "/non-h"], ["Image Set", "/imageset"], ["Cosplay", "/cosplay"],
    ["Asian Porn", "/asianporn"], ["Misc", "/misc"],
    ["Tiếng Việt", "/tag/language:vietnamese"], ["Tiếng Anh", "/tag/language:english"],
    ["Tiếng Trung", "/tag/language:chinese"],
  ];
  var result = [];
  for (var i = 0; i < cats.length; i++) result.push({ title: cats[i][0], input: cats[i][1], script: "list.js" });
  return Response.success(result);
}
