// Các tab ở mục Khám phá. input là PATH (list.js tự ghép domain và ?page=N).
// /tim-truyen?sort=: 15 truyện mới, 10 top all, 11 top tháng (12/13 hiện cho kết quả giống 11), 20 theo dõi.
function execute() {
  return Response.success([
    { title: "Mới cập nhật", input: "/", script: "list.js" },
    { title: "Truyện mới", input: "/tim-truyen?sort=15", script: "list.js" },
    { title: "Top all", input: "/tim-truyen?sort=10", script: "list.js" },
    { title: "Top tháng", input: "/tim-truyen?sort=11", script: "list.js" },
    { title: "Theo dõi nhiều", input: "/tim-truyen?sort=20", script: "list.js" },
  ]);
}
