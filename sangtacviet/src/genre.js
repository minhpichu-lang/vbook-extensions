// Thể loại (tham số category), nhãn phổ biến (tham số tag=<slug>,) và nguồn truyện (tham số host / type)
// của API danh sách.
function execute() {
  var q = "/io/searchtp/searchBooks?find=&minc=0&sort=update&tag=";
  return Response.success([
    { title: "Huyền huyễn", input: q + "&category=hh", script: "list.js" },
    { title: "Đô thị", input: q + "&category=dt", script: "list.js" },
    { title: "Ngôn tình", input: q + "&category=nt", script: "list.js" },
    { title: "Võng du", input: q + "&category=vd", script: "list.js" },
    { title: "Khoa học viễn tưởng", input: q + "&category=kh", script: "list.js" },
    { title: "Lịch sử", input: q + "&category=ls", script: "list.js" },
    { title: "Đồng nhân", input: q + "&category=dn", script: "list.js" },
    { title: "Dị năng", input: q + "&category=dna", script: "list.js" },
    { title: "Linh dị", input: q + "&category=ld", script: "list.js" },
    { title: "Light Novel", input: q + "&category=ln", script: "list.js" },
    { title: "Nhãn: Xuyên qua", input: q + "xuyenqua,", script: "list.js" },
    { title: "Nhãn: Hệ thống", input: q + "hethong,", script: "list.js" },
    { title: "Nhãn: Trùng sinh", input: q + "trungsinh,", script: "list.js" },
    { title: "Nhãn: Tiên hiệp", input: q + "tienhiep,", script: "list.js" },
    { title: "Nhãn: Diễn sinh cùng người", input: q + "diensinhcungnguoi,", script: "list.js" },
    { title: "Nhãn: Nữ chính", input: q + "nuchinh,", script: "list.js" },
    { title: "Nguồn: Qidian (Khởi Điểm)", input: q + "&host=qidian", script: "list.js" },
    { title: "Nguồn: Fanqie (Cà Chua)", input: q + "&host=fanqie", script: "list.js" },
    { title: "Nguồn: Faloo (Phi Lư)", input: q + "&host=faloo", script: "list.js" },
    { title: "Nguồn: Ciweimao", input: q + "&host=ciweimao", script: "list.js" },
    { title: "Nguồn: Jjwxc (Tấn Giang)", input: q + "&host=jjwxc", script: "list.js" },
    { title: "Nguồn: Sfacg", input: q + "&host=sfacg", script: "list.js" },
    { title: "Truyện sáng tác", input: q + "&type=sangtac", script: "list.js" },
    { title: "Truyện dịch", input: q + "&type=dich", script: "list.js" },
  ]);
}
