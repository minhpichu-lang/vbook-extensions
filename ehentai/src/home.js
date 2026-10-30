// Các tab ở mục Khám phá. input là path, list.js tự phân trang.
// Toplist: tl=15 hôm qua, 13 tháng qua, 12 năm qua, 11 mọi thời đại (50 gallery/trang).
function execute() {
  return Response.success([
    { title: "Mới nhất", input: "/", script: "list.js" },
    { title: "Tiếng Việt", input: "/tag/language:vietnamese", script: "list.js" },
    { title: "Phổ biến", input: "/popular", script: "list.js" },
    { title: "Top hôm qua", input: "/toplist.php?tl=15", script: "list.js" },
    { title: "Top tháng", input: "/toplist.php?tl=13", script: "list.js" },
    { title: "Top năm", input: "/toplist.php?tl=12", script: "list.js" },
    { title: "Top mọi thời đại", input: "/toplist.php?tl=11", script: "list.js" },
  ]);
}
