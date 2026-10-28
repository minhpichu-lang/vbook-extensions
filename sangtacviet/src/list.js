// Danh sách truyện (khám phá / thể loại). url: query của API danh sách do home.js / genre.js truyền vào,
// page: số trang (rỗng = trang 1). Logic tải và parse nằm ở fetchList() trong site.js.
load("site.js");

function execute(url, page) {
  return fetchList(url, page);
}
