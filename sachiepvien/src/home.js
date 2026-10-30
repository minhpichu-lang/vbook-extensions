// Các tab ở mục Khám phá. input là truy vấn REST API (list.js tự thêm per_page/page).
// Mã số: category 34 = Đề cử; dealstore (loại truyện) 474 = Sáng tác, 1704 = Lẩu Thập Cẩm (tuyển tập truyện ngắn).
function execute() {
  return Response.success([
    { title: "Mới đăng", input: "posts?orderby=date", script: "list.js" },
    { title: "Mới cập nhật", input: "posts?orderby=modified", script: "list.js" },
    { title: "Đề cử", input: "posts?categories=34", script: "list.js" },
    { title: "Sáng tác", input: "posts?dealstore=474", script: "list.js" },
    { title: "Lẩu Thập Cẩm", input: "posts?dealstore=1704", script: "list.js" },
  ]);
}
