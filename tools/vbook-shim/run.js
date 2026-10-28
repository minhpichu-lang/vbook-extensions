// Giả lập môi trường vbook (Rhino + jsoup) bằng Node + cheerio để test script.
const fs = require("fs");
const vm = require("vm");
const cheerio = require("cheerio");
const request = require("sync-request");

function wrapEl($, el) {
  return {
    attr: (k) => $(el).attr(k) ?? "",
    text: () => $(el).text().replace(/\s+/g, " "),
    tagName: () => el.tagName,
    html: () => $(el).html(),
    outerHtml: () => $.html(el),
    select: (sel) => wrapEls($, $(el).find(sel)),
  };
}
function wrapEls($, els) {
  return { size: () => els.length, get: (i) => wrapEl($, els[i]), first: () => els.length ? wrapEl($, els[0]) : null };
}
function wrapDoc(html) {
  const $ = cheerio.load(html);
  return { select: (sel) => wrapEls($, $(sel)) };
}

// Cookie jar tối giản (theo host) giống app: lưu Set-Cookie và tự gửi lại
const jar = {};
const sandbox = {
  fetch: (url, opts) => {
    const host = new URL(url).host;
    const reqOpts = { headers: { ...((opts && opts.headers) || {}) }, followRedirects: true };
    const stored = Object.entries(jar[host] || {}).map(([k, v]) => k + "=" + v).join("; ");
    if (stored) reqOpts.headers.Cookie = stored + (reqOpts.headers.Cookie ? "; " + reqOpts.headers.Cookie : "");
    // body dạng object -> form-urlencoded như app
    if (opts && opts.body != null) reqOpts.body = typeof opts.body === "string" ? opts.body : new URLSearchParams(opts.body).toString();
    const res = request((opts && opts.method) || "GET", url, reqOpts);
    const body = res.getBody("utf8");
    for (const c of [].concat(res.headers["set-cookie"] || [])) {
      const m = /^([^=;\s]+)=([^;]*)/.exec(c);
      if (m) (jar[host] = jar[host] || {})[m[1]] = m[2];
    }
    return { url: res.url || url, status: res.statusCode, ok: res.statusCode >= 200 && res.statusCode < 300, headers: res.headers, text: () => body, html: () => wrapDoc(body), json: () => JSON.parse(body) };
  },
  Html: { parse: wrapDoc },
  load: (f) => vm.runInContext(fs.readFileSync(require("path").join(require("path").dirname(require("path").resolve(process.argv[2])), f), "utf8"), ctx, { filename: f }),
  Response: { success: (data, next) => ({ ok: true, data, next }), error: (msg) => ({ ok: false, msg }) },
  Console: { log: (...a) => console.log(...a) },
  encodeURIComponent, parseInt, String, JSON,
  sleep: (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms),
  // App có localStorage lưu giữa các lần gọi; ở đây chỉ sống trong một lần chạy
  localStorage: (() => { const m = {}; return { getItem: (k) => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = "" + v; }, removeItem: (k) => { delete m[k]; } }; })(),
};

const [,, script, ...args] = process.argv;
const code = fs.readFileSync(script, "utf8");
const ctx = vm.createContext(sandbox);
vm.runInContext(code, ctx, { filename: script });
const out = vm.runInContext("execute", ctx)(...args.map(a => a === "null" ? null : a));
console.log(JSON.stringify(out, null, 2));
