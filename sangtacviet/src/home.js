// Các tab ở mục Khám phá. input là query của API danh sách (list.js ghép thêm &p=<trang>).
function execute() {
  return Response.success([
    { title: "Mới cập nhật", input: "/io/searchtp/searchBooks?find=&minc=0&sort=update&tag=", script: "list.js" },
    { title: "Đọc nhiều tuần", input: "/io/searchtp/searchBooks?find=&minc=0&sort=viewweek&tag=", script: "list.js" },
    { title: "Đọc nhiều", input: "/io/searchtp/searchBooks?find=&minc=0&sort=view&tag=", script: "list.js" },
    { title: "Mới nhập kho", input: "/io/searchtp/searchBooks?find=&minc=0&sort=new&tag=", script: "list.js" },
    { title: "Lượt thích", input: "/io/searchtp/searchBooks?find=&minc=0&sort=like&tag=", script: "list.js" },
    { title: "Hoàn thành", input: "/io/searchtp/searchBooks?find=&minc=0&sort=update&step=3&tag=", script: "list.js" },
    { title: "Truyện dài (>2000 chương)", input: "/io/searchtp/searchBooks?find=&minc=2000&sort=update&tag=", script: "list.js" },
  ]);
}
