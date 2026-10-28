# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quy tắc giao tiếp và ngôn ngữ

Đây là các quy tắc mặc định lâu dài của dự án. Hãy luôn tuân thủ trong toàn bộ quá trình làm việc.

1. Luôn giao tiếp, giải thích, đặt câu hỏi và trả lời bằng tiếng Việt.
2. Không tự động chuyển sang tiếng Anh, kể cả khi:
   * Bắt đầu một cuộc trò chuyện mới.
   * Mã nguồn sử dụng tiếng Anh.
   * Thông báo lỗi hoặc tài liệu kỹ thuật bằng tiếng Anh.
3. Tất cả Git commit message phải được viết bằng tiếng Anh.
4. Khi đề xuất commit message, ưu tiên dùng Conventional Commits, ví dụ:
   * `feat: add customer feedback form`
   * `fix: prevent duplicate report creation`
   * `refactor: simplify authentication logic`
5. Tất cả nội dung trong file Markdown (`.md`) phải được viết bằng tiếng Việt.
6. Các nội dung sau vẫn giữ nguyên bằng tiếng Anh:
   * Code.
   * Tên biến.
   * Tên hàm.
   * Tên class.
   * API endpoint.
   * Câu lệnh terminal.
   * Tên thư viện.
   * Thuật ngữ kỹ thuật cần giữ nguyên.
7. Khi tạo mới hoặc chỉnh sửa file `.md`, mặc định phải dùng tiếng Việt, trừ khi có yêu cầu rõ ràng dùng ngôn ngữ khác.
8. Khi trả lời, không được dùng tiếng Anh cho phần giải thích, kể cả khi đang phân tích code viết bằng tiếng Anh.
9. Các quy tắc này được xem là quy tắc mặc định lâu dài của dự án.

## Quy tắc coding an toàn và thay đổi tối thiểu

Khi code hoặc chỉnh sửa code, phải tuân thủ các quy tắc sau.

### 1. Suy nghĩ trước khi code

* Không tự đoán âm thầm nếu yêu cầu có nhiều cách hiểu.
* Nếu có điểm chưa rõ nhưng không phải blocker, hãy nêu giả định ngắn gọn rồi tiếp tục theo hướng an toàn nhất.
* Chỉ hỏi lại khi thiếu thông tin bắt buộc khiến không thể triển khai đúng.
* Nếu có cách đơn giản hơn, hãy nói rõ và ưu tiên cách đơn giản.
* Không phức tạp hóa vấn đề nếu yêu cầu thực tế chỉ cần thay đổi nhỏ.

### 2. Ưu tiên sự đơn giản

* Chỉ viết lượng code tối thiểu để giải quyết đúng yêu cầu.
* Không thêm tính năng ngoài phạm vi được yêu cầu.
* Không tạo abstraction, helper, config hoặc logic linh hoạt nếu chưa thật sự cần.
* Không viết code suy đoán cho các tình huống chưa được yêu cầu.
* Nếu giải pháp đang quá dài hoặc quá phức tạp, phải tự đơn giản hóa trước khi hoàn tất.

### 3. Thay đổi có kiểm soát

Khi chỉnh sửa code có sẵn:

* Chỉ sửa những file và dòng code thật sự liên quan đến yêu cầu.
* Không tự ý refactor code không liên quan.
* Không tự ý đổi format, comment hoặc style ở các khu vực không liên quan.
* Phải tuân theo style hiện tại của dự án, kể cả khi có cách khác tốt hơn.
* Nếu thấy dead code hoặc lỗi không liên quan, chỉ báo lại, không tự ý xóa nếu chưa được yêu cầu.

Khi thay đổi của bạn làm phát sinh code thừa:

* Được phép xóa import, biến, hàm hoặc logic mà chính thay đổi của bạn làm cho không còn dùng nữa.
* Không xóa dead code có sẵn từ trước nếu nó không liên quan trực tiếp đến yêu cầu.

Tiêu chí kiểm tra: mỗi dòng code bị thay đổi phải liên quan trực tiếp đến yêu cầu của người dùng.

### 4. Thực thi theo mục tiêu, nhưng không bắt buộc tạo test

Với mỗi yêu cầu code, trước khi triển khai phải xác định ngắn gọn:

* Mục tiêu cần đạt là gì.
* File/khu vực nào dự kiến cần sửa.
* Cách kiểm tra sau khi sửa.

Dự án này không phải lúc nào cũng có môi trường test hoặc server local để chạy API, vì vậy:

* Không bắt buộc phải tạo test nếu dự án chưa có test framework.
* Không tự ý dựng thêm môi trường test nếu chưa được yêu cầu.
* Nếu project đã có test sẵn, có thể cập nhật hoặc đề xuất test phù hợp.
* Nếu không chạy được test hoặc server local, phải kiểm tra bằng static review.

Static review tối thiểu gồm:

* Kiểm tra route/controller/service/schema/model liên quan.
* Kiểm tra import/export có đúng không.
* Kiểm tra field request/response có khớp convention dự án không.
* Kiểm tra middleware auth/permission nếu API cần phân quyền.
* Kiểm tra query database có đúng `company_id`, `site_id`, `user_id` hoặc các field liên quan không.
* Kiểm tra lỗi có trả đúng HTTP status code, không nuốt lỗi thành `200`.

Nếu có thể chạy lệnh an toàn như lint, typecheck hoặc build thì hãy chạy. Nếu không chạy được, phải nói rõ lý do.

### 5. Không được khẳng định đã test nếu chưa test thật

Nếu chưa chạy server local, chưa gọi API thật, hoặc chưa chạy test thật:

* Không được nói "đã test thành công".
* Không được nói "API hoạt động đúng".
* Chỉ được nói "đã kiểm tra logic/code bằng static review".
* Phải liệt kê rõ phần nào chưa kiểm tra được trên server thật.

Sau khi hoàn tất code, phải trả về tóm tắt gồm:

1. Files đã sửa.
2. Logic chính đã thay đổi.
3. API hoặc chức năng đã thêm/sửa.
4. Đã kiểm tra được gì bằng static review.
5. Chưa kiểm tra được gì vì không chạy server/test thật.
6. Checklist test thủ công bằng Postman/cURL/frontend nếu có API liên quan.

### 6. Checklist test thủ công cho API

Khi thêm hoặc sửa API, nếu không thể test trực tiếp, phải cung cấp checklist test thủ công gồm:

* Method.
* URL endpoint.
* Headers cần truyền.
* Query params hoặc body cần truyền.
* Response thành công mong đợi.
* Response lỗi thường gặp.
* Các case cần kiểm tra quyền truy cập, dữ liệu rỗng, dữ liệu sai và dữ liệu không tồn tại.

## What this repo is

A workspace for building **VBook extensions** — small JavaScript scraper plugins for the VBook mobile reading app (comics / novels / Chinese novels). The full spec is in [README.md](README.md) (written in Vietnamese). There is no build step, package manager, linter, or unit-test runner: scripts are plain JS executed by the app's embedded engine (Java/Rhino-style, **not** Node and **not** a browser — no `require`, `import`, `document`, `window`, async/await, or Promises).

## Extension layout

Each extension is one folder:

```
<extension>/
  plugin.json      # metadata + script filename map (see README for every field)
  icon.png
  src/*.js         # one file per role, each exporting a global `function execute(...)`
```

`plugin.json` → `script` maps roles to filenames in `src/`. Required roles: `detail`, `toc`, `chap`. Optional: `home`, `genre`, `search`, `page`. `metadata.regexp` is the URL pattern the app uses to route a story URL to this extension; `metadata.type` is `comic` | `novel` | `chinese_novel`; add `nsfw` to `tag` for 18+ sources.

## Script contracts (return shapes matter — the app parses them)

Every script defines `function execute(...)` and returns `Response.success(data[, next])` or `Response.error(msg)`.

| Role | Signature | Returns |
|---|---|---|
| `home`, `genre` | `execute()` | `[{ title, input, script }]` — tabs that dispatch to another script with `input` as its `url` |
| list content (script named by home/genre) | `execute(url, page)` | `[{ name, link, host?, cover, description }]`, `next` — `next` is fed back as `page`; empty/null stops paging |
| `search` | `execute(key, page)` | same list shape + `next`; if omitted the app falls back to Google search |
| `detail` | `execute(url)` | `{ name, cover, host, author, description, detail, ongoing, genres?, suggests?, comments? }` — the optional arrays are `[{ title, input, script }]`; url arrives with trailing `/` stripped |
| `page` | `execute(url)` | `[pageUrl, ...]` — only when the TOC is paginated |
| `toc` | `execute(url)` | `[{ name, url, host? }]` — `url` is a page from `page`, else the story url |
| `chap` | `execute(url)` | content string (HTML for novels, image list for comics) |
| comments script | `execute(input, next)` | `[{ name, content, description }]`, `next` |

`host` is only needed when `link`/`url` is relative.

## Runtime API available inside scripts

- `fetch(url[, { method, headers, body }])` → sync `Response` with `.status`, `.ok`, `.headers`, `.html([charset])` (jsoup `Document`), `.text([charset])`, `.json()`.
- `Html.parse(text)`, `Html.clean(text, ["div","p"])`. Selectors are **jsoup** syntax (`doc.select(...)`, `.attr()`, `.text()`), not DOM APIs.
- `Engine.newBrowser()` for JS-rendered sites: `.setUserAgent(UserAgent.android())`, `.launch(url, timeout)`, `.callJs(script, wait)`, `.urls()`, `.waitUrl(urls, timeout)`, `.html()`, `.close()` — always close it.
- `Console.log()` (goes to logcat), `load("file.js")` to share helpers between scripts, `sleep(ms)`.

## Testing an extension

No automated tests. Scripts are run against the real target site via the **vbook-vscode-tester** VS Code extension (`vbook-vscode-tester-0.0.4.vsix`, or the older release from github.com/faea726/vbook-extension-maker): open a script, right-click → pick the role, enter the URL/key when prompted. Testing on-device requires Java ≥ 1.8 on the PC, phone and PC on the same LAN, and developer mode enabled in the app (tap the version name 7 times) to get the phone's IP.

## Extensions in this repo

- `vinahentai/` — vinahentai.click (comic, nsfw). Site is React Router SSR behind Cloudflare: **every `fetch` must send a browser `User-Agent`** (Java's default UA gets 403). All scripts `load("site.js")` (verified to work both in tester mode and installed) and go through `siteFetch(pathOrUrl)` / `siteUrl(href)`; the domain lives only in `site.js` (`DEFAULT_BASE`, optional `REMOTE_DOMAIN_URL` text file, `FALLBACK_BASES`). `siteFetch` follows redirects via `response.url`, strips whatever host the app hands back (bookmarked stories carry the old domain), and only probes fallbacks when the primary domain no longer looks like the site (`looksLikeSite`). A response body can be read **once** — `text()` then `html()` returns null — so `siteFetch` returns a wrapper with the cached body. `home.js`/`genre.js`/detail `genres`/`suggests` pass **paths** as `input`, never absolute URLs. The 18+ popup is client-side only. Chapter images beyond the first three are lazy-loaded, so `chap.js` regexes `vnht.vinahentai.click/manga-images/...` URLs out of the raw HTML (they appear in page order in the turbo-stream payload). Source pages are huge (750–950 KB, ~4500×5800 px, ~27 MB/chapter) and the CDN has no resize endpoint (`?w=`, `/cdn-cgi/image/` are no-ops; wsrv.nl and statically.io block the domain), so `chap.js` can optionally route images through Photon (`i0.wp.com/<host>/<path>?w=1080`) — toggle `IMAGE_PROXY`, **off by default**: ~12× less data, but uncached loads take 1–3 s/image vs 0.3–0.5 s direct on Wi-Fi, and its first-load latency made reading slower on Wi-Fi. The origin is also sporadically slow (one of 12 concurrent list requests took 11 s), so `list.js` retries with `sleep()` between attempts. Detail pages render only the first 8 genre chips; the rest live only in the turbo-stream payload (not parsed). Pagination differs per route: `/danh-sach` and `/genres/*` page until a page returns 0 cards; `/search` uses `\"total\",N` / `\"limit\",40` from the payload; `/leaderboard`, `/authors/*`, `/translators/*` ignore `?page`.

- `sangtacviet/` — sangtacviet.com (novel, dịch máy Trung→Việt từ qidian/fanqie/faloo/ciweimao/jjwxc/... và truyện "dich"/"sangtac" của thành viên). Mọi script `load("site.js")`; URL truyện `/truyen/<host>/1/<bookid>/`, chương `/truyen/<host>/1/<bookid>/<cid>/` (`parseBookUrl`). Danh sách/tìm kiếm/thể loại đều là một API HTML: `GET /io/searchtp/searchBooks?find=&findinname=<key>&sort=…&category=<mã>&host=<nguồn>&type=sangtac|dich&step=3&tag=<slug>,&p=N` (48 truyện/trang, không cần cookie; slug tag = bỏ dấu + bỏ ký tự không phải chữ số, `slugVietnamese()`). Mục lục: `GET /index.php?ngmar=chapterlist&h=<host>&bookid=<id>&sajax=getchapterlist` **bắt buộc có Referer** (thiếu thì body rỗng), trả `{code:1,data:"1-/-<cid>-/-<tên>[-/-vip]-//-…"}`. Nội dung chương (`chap.js`) có handshake chống bot, chi tiết trong comment đầu file; các điểm dễ vỡ: (1) app có **cookie jar tự động app-wide** (lưu Set-Cookie và tự gửi lại, thậm chí gộp cả header `Cookie` tự đặt) → **không được tự đặt header Cookie** cho site này, cookie trùng tên làm server trả lỗi 4003; session mới thì `_ac` chỉ nằm trong HTML (`document.cookie`), GET lại lần 2 mới nhận qua Set-Cookie; (2) POST đọc chương phải có `Content-Type: application/x-www-form-urlencoded` và **body rỗng** (`body: {}` → Content-Length 0), nếu không server âm thầm trả **một chương ngẫu nhiên** của cùng truyện — phát hiện qua `json.origin` (URL nguồn gốc phải chứa cid); (3) gửi `X-Requested-With` khi session đã mở khóa → lỗi. `response.headers` trên engine thật là object JS thuần, key chữ thường, mỗi header **chỉ giữ một giá trị** (`headers["set-cookie"]`). Captcha (mã 21; trang cho chọn Cloudflare Turnstile hoặc captcha ảnh của site, xác thực qua `ajax=verifycaptcha`) do site bắt khi đọc quá nhiều chương theo IP (10/2026: cách 3 s bị bắt ở chương thứ 8, cách 12 s ở chương thứ 10, cách 20 s đọc 12 chương vẫn ổn; lần vi phạm sau bị khóa lâu hơn) và **mở khóa theo IP**: quét bằng Chrome trên điện thoại là vbook đọc lại được. Quét trong WebView của vbook luôn thất bại vì JS obfuscate của site vô hiệu hóa `XMLHttpRequest.send` khi có `window.Android`. vbook gọi `chap.js` **song song** (tải trước chương, tải truyện) nên `chap.js` giãn nhịp toàn cục: mỗi lần gọi giữ một lượt cách nhau `CHAP_INTERVAL_MS` (mặc định 20 s) qua `localStorage` (engine có `localStorage.getItem/setItem`, lưu được giữa các lần gọi; không có `java`/`Packages`, biến toàn cục không giữ lại), và không thử lại khi gặp mã 21. Trang chương còn đặt cookie `_gac`/`_ac`/`_acx` bằng `document.cookie`, nhưng gửi kèm chúng không làm giảm captcha. API đăng nhập (`ajax=login`) luôn trả `captcha` nên không đăng nhập được bằng code. Ảnh minh họa trong chương ciweimao nằm ở `c1.kuangxiangit.com`, CDN này chặn Referer lạ (403 "denied by Referer ACL"; web dùng `referrerpolicy=no-referrer`) mà vbook tải ảnh kèm Referer là URL chương → `renderContent` đổi sang Photon `i0.wp.com/<host>/<path>` (`wsrv.nl` bị chặn). Truyện `sangtac` (thành viên tự viết) được mã hóa bằng font riêng (ký tự Private Use Area) → chap.js báo lỗi "chưa hỗ trợ". Tên nhân vật: bản dịch máy của API đọc chương không áp dụng name (web áp dụng phía trình duyệt), nên `chap.js` thay tên theo chữ gốc (`t='…'` của từng `<i>`, khớp 1–6 từ liền nhau đúng ranh giới) từ 3 nguồn theo thứ tự ưu tiên: `BOOK_NAME_MAP` (thêm tay theo truyện), gói name người đọc đăng (`GET /namesys.php?host=&book=`, chỉ lấy mục có trong ≥25% số gói, cache `localStorage` 3 ngày, không cache khi chưa có gói nào; site lấy một số truyện về 2 lần từ cùng nguồn, cùng id — vd `trxs/12188` và `trxs2/12188` — và gói chỉ được đăng ở bản đầu, nên nguồn `<tên>2` không có gói thì lấy gói của `<tên>`), `NAME_MAP` (chung). Trạng thái truyện lấy từ `var bookstep=1|2|3` (Còn tiếp/Tạm ngưng/Hoàn thành), ảnh bìa từ `bookinfo.thumb` trong JS của trang.

- `hentaivnx/` — hentaivnx.live (comic, nsfw). Template NetTruyen (ASP.NET `ctl00`), HTML render sẵn phía server, không cần cookie. Domain chỉ nằm trong `site.js` (`DEFAULT_BASE`, đổi qua "Add code" `let DOMAIN = ...;`); `siteFetch` bỏ host của URL nhận vào và theo redirect qua `response.url`. URL truyện `/truyen-hentai/<slug>-<id>`, chương `/truyen-hentai/<slug>/chapter-<n>/<chapId>`. Danh sách/thể loại/tìm kiếm cùng layout `div.items div.item` (40 truyện/trang), có trang sau khi có `ul.pagination a[rel=next]`: trang chủ `/?page=N`, `/tim-truyen?sort=15|10|11|20` (12/13 giống 11, `status=2` trả rỗng), `/tim-truyen/<slug>`, `/tim-truyen?keyword=`. Một số tên truyện bị escape 2 lần (`&#8230;`) → `decodeEntities()`. Không có phần tóm tắt truyện. Mục lục đầy đủ trong `#nt_listchapter` ("Xem thêm" chỉ là client-side). Ảnh chương nằm trong JS `var cdn1..cdn4 = '[...]'` (URL có `&amp;`, hậu tố `-----<width>` là ảnh ghép ngang); server 1 (`sv*.2tcdn.cfd`) là mặc định, server 2 `all.2tcdn.cfd` có token hết hạn ~1 ngày. Vài truyện cũ có server 1 là DuckDuckGo proxy của `img.henzz.xyz` đã chết (400) nên `chap.js` dò ảnh đầu từng server bằng GET `Range: bytes=0-0` và chọn server đầu tiên sống.

## Testing scripts

Two Node tools in `tools/vbook-shim/` (`npm install` there first). The phone runner is the source of truth; the local shim is a quick pre-check.

**On the phone (real engine)** — enable developer mode in the app (tap the version name 7 times) to get its `http://<ip>:8080`, phone and PC on the same LAN:

```
cd tools/vbook-shim
MSYS_NO_PATHCONV=1 node phone.js http://<ip>:8080 ../../vinahentai/src/list.js "/danh-sach" 2   # MSYS_NO_PATHCONV: Git Bash otherwise rewrites "/danh-sach" into a Windows path
node install.js http://<ip>:8080 ../../vinahentai      # (re)install the extension into the app
```

Local shim `run.js` có cookie jar tối giản theo host (giống app) và hỗ trợ `body` dạng object cho POST. Trong Rhino, `load()` chạy lúc thực thi nên **không `load()` một file có định nghĩa `execute`** (nó ghi đè `execute` của script hiện tại); helper dùng chung để trong `site.js`.

`phone.js` speaks the same protocol as vbook-extension-maker (`GET /test` with a base64 `data` header; it also serves `load()`-ed files on port `<app port> − 10`). The reply's `result.data2` is the `next` value.

**Packaging / installing on other phones** — `node build.js ../../vinahentai` writes `vinahentai/plugin.zip` (plugin.json + icon.png + src/*.js, skipping `_*.js` scratch files). Copy the zip to the phone and install it in vbook via Khám phá → ⋮ → *T.cả phần mở rộng* → ⋮ → *Thêm extension* (file picker) — verified working, `load("site.js")` included. Sideloaded and dev-mode installs both show a DEBUG badge; after deleting a duplicate, restart the app or the Explore screen throws an NPE on the stale instance. Cập nhật qua GitHub: vbook *Quản lý nguồn* trỏ tới URL raw của index `plugin.json` ở thư mục gốc (định dạng theo Darkrai9x/vbook-extensions). Mỗi lần push lên `main`, workflow `.github/workflows/build.yml` chạy `node build-all.js`: build lại `plugin.zip` của mọi thư mục có `plugin.json` + `src/`, chép `metadata.version` của từng extension vào index, rồi tự commit (`[skip ci]`). Khi phát hành chỉ cần **tăng `metadata.version` trong `<extension>/plugin.json`** rồi push (không tăng thì vbook không thấy bản mới), sau đó `git pull` để lấy zip do bot commit. `build.js` cố định thời gian file trong zip nên cùng nội dung thì zip giống hệt, không sinh commit thừa. `sangtacviet/Names_Thay_The.txt` (danh sách thay tên cá nhân) nằm trong `.gitignore`.

**Locally (no phone)** — `run.js` emulates the runtime with cheerio + sync-request: `node run.js ../../vinahentai/src/detail.js "<url>"`; pass `null` for an empty `page`.

**Real engine API (Rhino + custom jsoup wrapper)** — narrower than jsoup. Element: `attr text html outerHtml select tagName remove`. Elements: those plus `first last get size isEmpty`. There is **no** `selectFirst`, `nextElementSibling`, `parent`, `children` — use jsoup combinators (`h1 + div`, `:containsOwn(...)`) instead. **`Elements.first()` never returns null** — on an empty match it yields an empty element whose `text()` is `""` — so every script defines `first(el, sel)` that checks `size() > 0`; never write `.select(x).first() == null`. Java strings come back from `text()`/`attr()`: wrap with `"" + x` before string ops. **Percent-encode non-ASCII in every URL returned to the app** (`encodeUnicode()` in the scripts): the app puts the story/chapter URL in the image loader's `Referer` header and OkHttp rejects non-ASCII header values, surfacing as `okhttp3.Call … null object reference` on covers and pages of stories with Unicode slugs (`…-xinh-đep`, Japanese titles). The site's own hrefs are raw Unicode, so `toc.js` matches chapter links against both raw and encoded story paths. ES5 only (no arrow functions, `let`/`const`, template literals).
