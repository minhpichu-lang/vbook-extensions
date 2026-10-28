// Tìm kiếm theo tên truyện / tên hán việt / tác giả (tham số findinname của API danh sách).
load("site.js");

function execute(key, page) {
  var query = "/io/searchtp/searchBooks?find=&findinname=" + encodeURIComponent(("" + key).trim()) + "&minc=0&sort=viewweek&tag=";
  return fetchList(query, page);
}
