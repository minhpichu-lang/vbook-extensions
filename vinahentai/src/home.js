// Các tab hiển thị ở mục Khám phá. Mỗi tab gọi list.js với input là PATH của danh sách
// (không kèm domain, để list.js tự ghép với domain hiện tại của site).
function execute() {
  return Response.success([
    { title: "Mới cập nhật", input: "/danh-sach", script: "list.js" },
    { title: "Xem nhiều", input: "/danh-sach?sort=views", script: "list.js" },
    { title: "Đã hoàn thành", input: "/danh-sach?status=completed", script: "list.js" },
    { title: "Bảng xếp hạng", input: "/leaderboard", script: "list.js" },
  ]);
}
