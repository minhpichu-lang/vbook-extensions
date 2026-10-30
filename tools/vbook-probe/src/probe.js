// Dò khả năng engine vbook trước khi làm extension sachiepvien.net: nội dung truyện full là file .txt
// mã hóa AES-128-CTR trên Mega, nên cần (1) POST body chuỗi JSON tới API Mega, (2) đọc response nhị phân
// giữ nguyên từng byte, (3) AES bằng JS thuần đủ nhanh.
//   cd tools/vbook-shim && node phone.js http://<ip>:8080 ../vbook-probe/src/probe.js
// File mẫu: "Ngút trời đại gia chủ" (71 MB), https://mega.nz/file/tm40DKhb#<MEGA_KEY>
var MEGA_HANDLE = "tm40DKhb";
var MEGA_KEY = "HxKV2rR2ST0c-VLm9AbxgTlSdWU51uEf5co0DbeDLQQ";
var CIPHER_HEAD = "fbaa5df89f589f186547a966d47b47be"; // 16 byte đầu file mã hóa (lấy bằng curl trên PC)
var PLAIN_HEAD = "﻿Truyện bạn đang theo dõi";
var TIME_BUDGET_MS = 60000; // phone.js timeout 120 s

var out = [];
function log(k, v) { out.push(k + ": " + v); }

function execute() {
    var start = Date.now();
    probeEnv();
    probeStorage();
    var g = probeMegaApi();
    if (g) {
        probeBrowser(g);
        var charset = probeBinary(g);
        if (charset) probeDecrypt(g, charset, start);
    }
    log("total_ms", Date.now() - start);
    return Response.success(out);
}

function probeEnv() {
    var names = ["java", "Packages", "JavaImporter", "localStorage", "Uint8Array", "Int32Array", "ArrayBuffer",
        "atob", "btoa", "TextDecoder", "Promise", "Engine", "Html", "Console", "sleep", "load"];
    var have = [];
    for (var i = 0; i < names.length; i++) {
        var t;
        try { t = eval("typeof " + names[i]); } catch (e) { t = "error"; }
        have.push(names[i] + "=" + t);
    }
    log("globals", have.join(", "));
    var es6 = {
        "let": "let a = 1; a",
        "const": "(function () { const b = 2; return b; })()",
        "arrow": "(function () { return (x => x + 1)(1); })()",
        "template": "`ok`",
        "for_of": "(function () { var s = 0; for (var x of [1, 2]) s += x; return s; })()",
        "Uint8Array_ops": "(function () { var a = new Uint8Array(4); a[0] = 300; return a[0]; })()"
    };
    var res = [];
    for (var k in es6) {
        try { res.push(k + "=" + eval(es6[k])); } catch (e) { res.push(k + "=ERR"); }
    }
    log("es6", res.join(", "));
}

function probeStorage() {
    try {
        localStorage.setItem("probe_key", "v" + Date.now());
        log("localStorage", "ok " + localStorage.getItem("probe_key"));
    } catch (e) { log("localStorage", "ERR " + e); }
}

// API Mega chỉ nhận POST body JSON (chuỗi) -> trả link tải tạm "g" (hết hạn sau vài giờ)
function probeMegaApi() {
    var t = Date.now();
    try {
        var r = fetch("https://g.api.mega.co.nz/cs?id=" + t, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: '[{"a":"g","g":1,"ssl":1,"p":"' + MEGA_HANDLE + '"}]'
        });
        var body = "" + r.text();
        log("mega_api", "status=" + r.status + " ms=" + (Date.now() - t) + " body=" + body.substring(0, 160));
        var j = JSON.parse(body);
        if (j && j[0] && j[0].g) { log("mega_size", j[0].s); return "" + j[0].g; }
    } catch (e) { log("mega_api", "ERR " + e); }
    return null;
}

// Giải mã trong WebView: fetch (Mega trả CORS *) + crypto.subtle AES-CTR + TextDecoder đều native.
// Trang chạy bất đồng bộ rồi ghi kết quả vào <pre id="out">, Rhino đọc lại bằng browser.html()
function probeBrowser(g) {
    var size = 256 * 1024, k = b64urlWords(MEGA_KEY);
    var key = wordsToBytes([k[0] ^ k[4], k[1] ^ k[5], k[2] ^ k[6], k[3] ^ k[7]]);
    var ctr = wordsToBytes([k[4], k[5], 0, 0]);
    var js = "(function(){var t0=Date.now(),t1;" +
        "function done(a,txt){var p=document.createElement('pre');p.id='out';for(var x in a)p.setAttribute(x,a[x]);p.textContent=txt;document.body.appendChild(p);}" +
        "fetch('" + g + "/0-" + (size - 1) + "').then(function(r){return r.arrayBuffer();}).then(function(buf){t1=Date.now();" +
        "return crypto.subtle.importKey('raw',new Uint8Array([" + key.join(",") + "]),'AES-CTR',false,['decrypt']).then(function(ck){" +
        "return crypto.subtle.decrypt({name:'AES-CTR',counter:new Uint8Array([" + ctr.join(",") + "]),length:64},ck,buf);});" +
        "}).then(function(p){var t2=Date.now();var txt=new TextDecoder().decode(p);" +
        "done({'data-fetch':t1-t0,'data-dec':t2-t1,'data-utf8':Date.now()-t2,'data-len':txt.length},txt);" +
        "}).catch(function(e){done({'data-err':''+e},'');});})();";
    var browser = null, t = Date.now();
    try {
        browser = Engine.newBrowser();
        browser.launch("https://g.api.mega.co.nz/cs", 15000); // trang JSON nhẹ, https (crypto.subtle cần secure context); "/" redirect sang web app mega.nz nặng làm treo
        log("browser_launch_ms", Date.now() - t);
        t = Date.now();
        browser.callJs(js, 100);
        var pre = null;
        while (Date.now() - t < 20000) {
            var doc = browser.html();
            if (doc.select("#out").size() > 0) { pre = doc.select("#out").first(); break; }
            sleep(200);
        }
        if (!pre) { log("browser", "timeout ms=" + (Date.now() - t)); return; }
        var text = "" + pre.text();
        log("browser", "wait_ms=" + (Date.now() - t) + " fetch=" + pre.attr("data-fetch") + " dec=" + pre.attr("data-dec") +
            " utf8=" + pre.attr("data-utf8") + " len=" + pre.attr("data-len") + " err=" + pre.attr("data-err") +
            " ok=" + (text.indexOf(PLAIN_HEAD) == 0));
    } catch (e) {
        log("browser", "ERR " + e);
    } finally {
        if (browser) browser.close();
    }
}

function wordsToBytes(w) {
    var b = [];
    for (var i = 0; i < w.length; i++) b.push((w[i] >>> 24) & 0xff, (w[i] >>> 16) & 0xff, (w[i] >>> 8) & 0xff, w[i] & 0xff);
    return b;
}

// Mỗi response chỉ đọc body được một lần -> fetch lại cho từng charset thử
function probeBinary(g) {
    try {
        var r0 = fetch(g + "/0-15");
        var members = [];
        for (var m in r0) members.push(m);
        log("response_members", members.join(","));
        log("default_text", hexOf("" + r0.text()));
    } catch (e) { log("response_members", "ERR " + e); }
    var charsets = ["ISO-8859-1", "latin1", "windows-1252", "x-user-defined"];
    var ok = null;
    for (var i = 0; i < charsets.length; i++) {
        try {
            var s = "" + fetch(g + "/0-15").text(charsets[i]);
            var hex = hexOf(s);
            var match = hex == CIPHER_HEAD;
            log("text(" + charsets[i] + ")", (match ? "MATCH " : "diff ") + "len=" + s.length + " " + hex);
            if (match && !ok) ok = charsets[i];
        } catch (e) { log("text(" + charsets[i] + ")", "ERR " + e); }
    }
    return ok;
}

function probeDecrypt(g, charset, start) {
    var size = 256 * 1024, t = Date.now();
    var s = "" + fetch(g + "/0-" + (size - 1)).text(charset);
    log("download_256k", "len=" + s.length + " ms=" + (Date.now() - t));
    var bad = 0;
    for (var i = 0; i < s.length; i++) if (s.charCodeAt(i) > 255) bad++;
    log("chars_over_255", bad);

    t = Date.now();
    var k = b64urlWords(MEGA_KEY);
    var ks = aesKeySchedule([k[0] ^ k[4], k[1] ^ k[5], k[2] ^ k[6], k[3] ^ k[7]]);
    log("aes_init_ms", Date.now() - t);

    t = Date.now();
    var bytes = [], blk = 0, n = s.length;
    for (var off = 0; off < n; off += 16, blk++) {
        if (Date.now() - start > TIME_BUDGET_MS) break;
        var w = aesEncryptBlock(ks, k[4], k[5], 0, blk);
        for (var j = 0; j < 16 && off + j < n; j++) {
            bytes.push((s.charCodeAt(off + j) & 0xff) ^ ((w[j >> 2] >>> (24 - 8 * (j & 3))) & 0xff));
        }
    }
    var ms = Date.now() - t;
    log("aes_ctr", "bytes=" + bytes.length + " ms=" + ms + " KB/s=" + Math.round(bytes.length / 1.024 / Math.max(ms, 1)));

    t = Date.now();
    var d = utf8Decode(bytes);
    log("utf8_decode", "ms=" + (Date.now() - t) + " invalid=" + d.invalid + " chars=" + d.text.length);
    log("plain_ok", d.text.indexOf(PLAIN_HEAD) == 0);
    log("plain_head", d.text.substring(0, 120));
    probeFast(s.substring(0, 64 * 1024), k, ks);
}

// Biến thể nhanh: vòng AES viết liền trong một hàm, bảng tra truyền vào làm biến cục bộ;
// so sánh mảng thường với Int32Array, và giải mã UTF-8 bằng decodeURIComponent(escape(...)) (hàm native)
function probeFast(s, k, ks) {
    var variants = [
        ["plain", SBOX, SM0, SM1, SM2, SM3, ks],
        ["int32", new Int32Array(SBOX), new Int32Array(SM0), new Int32Array(SM1), new Int32Array(SM2), new Int32Array(SM3), new Int32Array(ks)]
    ];
    for (var v = 0; v < variants.length; v++) {
        var a = variants[v], t = Date.now(), codes;
        try {
            codes = ctrRun(s, k[4], k[5], 0, a[6], a[1], a[2], a[3], a[4], a[5]);
        } catch (e) { log("fast_" + a[0], "ERR " + e); continue; }
        var ms = Date.now() - t;
        t = Date.now();
        var parts = [];
        for (var i = 0; i < codes.length; i += 4096) parts.push(String.fromCharCode.apply(null, codes.slice(i, i + 4096)));
        var bin = parts.join(""), ms2 = Date.now() - t, text;
        t = Date.now();
        try { text = decodeURIComponent(escape(bin)); } catch (e) { text = "ERR " + e; }
        log("fast_" + a[0], "bytes=" + codes.length + " aes_ms=" + ms + " KB/s=" + Math.round(codes.length / 1.024 / Math.max(ms, 1)) +
            " join_ms=" + ms2 + " utf8_ms=" + (Date.now() - t) + " ok=" + (text.indexOf(PLAIN_HEAD) == 0));
    }
}

function ctrRun(s, iv0, iv1, blk, ks, S, M0, M1, M2, M3) {
    var n = s.length, out = [], off = 0;
    while (off < n) {
        var s0 = iv0 ^ ks[0], s1 = iv1 ^ ks[1], s2 = ks[2], s3 = blk ^ ks[3], r = 4, t0, t1, t2, t3;
        for (var round = 1; round < 10; round++) {
            t0 = M0[s0 >>> 24] ^ M1[(s1 >>> 16) & 0xff] ^ M2[(s2 >>> 8) & 0xff] ^ M3[s3 & 0xff] ^ ks[r];
            t1 = M0[s1 >>> 24] ^ M1[(s2 >>> 16) & 0xff] ^ M2[(s3 >>> 8) & 0xff] ^ M3[s0 & 0xff] ^ ks[r + 1];
            t2 = M0[s2 >>> 24] ^ M1[(s3 >>> 16) & 0xff] ^ M2[(s0 >>> 8) & 0xff] ^ M3[s1 & 0xff] ^ ks[r + 2];
            t3 = M0[s3 >>> 24] ^ M1[(s0 >>> 16) & 0xff] ^ M2[(s1 >>> 8) & 0xff] ^ M3[s2 & 0xff] ^ ks[r + 3];
            s0 = t0; s1 = t1; s2 = t2; s3 = t3; r += 4;
        }
        t0 = ((S[s0 >>> 24] << 24) | (S[(s1 >>> 16) & 0xff] << 16) | (S[(s2 >>> 8) & 0xff] << 8) | S[s3 & 0xff]) ^ ks[40];
        t1 = ((S[s1 >>> 24] << 24) | (S[(s2 >>> 16) & 0xff] << 16) | (S[(s3 >>> 8) & 0xff] << 8) | S[s0 & 0xff]) ^ ks[41];
        t2 = ((S[s2 >>> 24] << 24) | (S[(s3 >>> 16) & 0xff] << 16) | (S[(s0 >>> 8) & 0xff] << 8) | S[s1 & 0xff]) ^ ks[42];
        t3 = ((S[s3 >>> 24] << 24) | (S[(s0 >>> 16) & 0xff] << 16) | (S[(s1 >>> 8) & 0xff] << 8) | S[s2 & 0xff]) ^ ks[43];
        var end = off + 16 < n ? off + 16 : n;
        for (var j = off; j < end; j++) {
            var w = (j - off) < 8 ? ((j - off) < 4 ? t0 : t1) : ((j - off) < 12 ? t2 : t3);
            out[j] = (s.charCodeAt(j) & 0xff) ^ ((w >>> (24 - 8 * ((j - off) & 3))) & 0xff);
        }
        off = end; blk++;
    }
    return out;
}

function hexOf(s) {
    var h = "";
    for (var i = 0; i < s.length && i < 16; i++) h += ((s.charCodeAt(i) & 0xffff) < 16 ? "0" : "") + (s.charCodeAt(i) & 0xffff).toString(16);
    return h;
}

function b64urlWords(s) {
    var A = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_", bytes = [], buf = 0, bits = 0;
    for (var i = 0; i < s.length; i++) {
        buf = (buf << 6) | A.indexOf(s.charAt(i)); bits += 6;
        if (bits >= 8) { bits -= 8; bytes.push((buf >> bits) & 0xff); }
    }
    var w = [];
    for (var j = 0; j + 3 < bytes.length; j += 4) w.push(((bytes[j] << 24) | (bytes[j + 1] << 16) | (bytes[j + 2] << 8) | bytes[j + 3]) >>> 0);
    return w;
}

// AES-128 (chỉ chiều mã hóa, CTR không cần giải mã khối), bảng tra theo kiểu CryptoJS
var SBOX = [], SM0 = [], SM1 = [], SM2 = [], SM3 = [];
(function () {
    var d = [], i, x = 0, xi = 0;
    for (i = 0; i < 256; i++) d[i] = i < 128 ? i << 1 : (i << 1) ^ 0x11b;
    for (i = 0; i < 256; i++) {
        var sx = xi ^ (xi << 1) ^ (xi << 2) ^ (xi << 3) ^ (xi << 4);
        sx = (sx >>> 8) ^ (sx & 0xff) ^ 0x63;
        SBOX[x] = sx;
        var x2 = d[x], x4 = d[x2], x8 = d[x4];
        var t = (d[sx] * 0x101) ^ (sx * 0x1010100);
        SM0[x] = (t << 24) | (t >>> 8);
        SM1[x] = (t << 16) | (t >>> 16);
        SM2[x] = (t << 8) | (t >>> 24);
        SM3[x] = t;
        if (!x) { x = xi = 1; } else { x = x2 ^ d[d[d[x8 ^ x2]]]; xi ^= d[d[xi]]; }
    }
})();
var RCON = [0x00, 0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80, 0x1b, 0x36];

function aesKeySchedule(key) {
    var ks = [];
    for (var r = 0; r < 44; r++) {
        if (r < 4) { ks[r] = key[r]; continue; }
        var t = ks[r - 1];
        if (!(r % 4)) {
            t = (t << 8) | (t >>> 24);
            t = (SBOX[t >>> 24] << 24) | (SBOX[(t >>> 16) & 0xff] << 16) | (SBOX[(t >>> 8) & 0xff] << 8) | SBOX[t & 0xff];
            t ^= RCON[(r / 4) | 0] << 24;
        }
        ks[r] = ks[r - 4] ^ t;
    }
    return ks;
}

function aesEncryptBlock(ks, s0, s1, s2, s3) {
    s0 ^= ks[0]; s1 ^= ks[1]; s2 ^= ks[2]; s3 ^= ks[3];
    var r = 4, t0, t1, t2, t3;
    for (var round = 1; round < 10; round++) {
        t0 = SM0[s0 >>> 24] ^ SM1[(s1 >>> 16) & 0xff] ^ SM2[(s2 >>> 8) & 0xff] ^ SM3[s3 & 0xff] ^ ks[r++];
        t1 = SM0[s1 >>> 24] ^ SM1[(s2 >>> 16) & 0xff] ^ SM2[(s3 >>> 8) & 0xff] ^ SM3[s0 & 0xff] ^ ks[r++];
        t2 = SM0[s2 >>> 24] ^ SM1[(s3 >>> 16) & 0xff] ^ SM2[(s0 >>> 8) & 0xff] ^ SM3[s1 & 0xff] ^ ks[r++];
        t3 = SM0[s3 >>> 24] ^ SM1[(s0 >>> 16) & 0xff] ^ SM2[(s1 >>> 8) & 0xff] ^ SM3[s2 & 0xff] ^ ks[r++];
        s0 = t0; s1 = t1; s2 = t2; s3 = t3;
    }
    return [
        ((SBOX[s0 >>> 24] << 24) | (SBOX[(s1 >>> 16) & 0xff] << 16) | (SBOX[(s2 >>> 8) & 0xff] << 8) | SBOX[s3 & 0xff]) ^ ks[r++],
        ((SBOX[s1 >>> 24] << 24) | (SBOX[(s2 >>> 16) & 0xff] << 16) | (SBOX[(s3 >>> 8) & 0xff] << 8) | SBOX[s0 & 0xff]) ^ ks[r++],
        ((SBOX[s2 >>> 24] << 24) | (SBOX[(s3 >>> 16) & 0xff] << 16) | (SBOX[(s0 >>> 8) & 0xff] << 8) | SBOX[s1 & 0xff]) ^ ks[r++],
        ((SBOX[s3 >>> 24] << 24) | (SBOX[(s0 >>> 16) & 0xff] << 16) | (SBOX[(s1 >>> 8) & 0xff] << 8) | SBOX[s2 & 0xff]) ^ ks[r++]
    ];
}

// Ký tự UTF-8 bị cắt ở cuối đoạn được tính là invalid (bình thường khi cắt theo byte)
function utf8Decode(b) {
    var parts = [], codes = [], invalid = 0, i = 0, n = b.length;
    while (i < n) {
        var c = b[i], cp = -1, need = 0;
        if (c < 0x80) { cp = c; } else if ((c & 0xe0) == 0xc0) { cp = c & 0x1f; need = 1; }
        else if ((c & 0xf0) == 0xe0) { cp = c & 0x0f; need = 2; } else if ((c & 0xf8) == 0xf0) { cp = c & 0x07; need = 3; }
        else { invalid++; i++; continue; }
        if (i + need >= n) { invalid++; break; }
        for (var j = 1; j <= need; j++) {
            if ((b[i + j] & 0xc0) != 0x80) { cp = -1; break; }
            cp = (cp << 6) | (b[i + j] & 0x3f);
        }
        if (cp < 0) { invalid++; i++; continue; }
        i += need + 1;
        if (cp > 0xffff) { cp -= 0x10000; codes.push(0xd800 + (cp >> 10), 0xdc00 + (cp & 0x3ff)); } else codes.push(cp);
        if (codes.length >= 4096) { parts.push(String.fromCharCode.apply(null, codes)); codes = []; }
    }
    parts.push(String.fromCharCode.apply(null, codes));
    return { text: parts.join(""), invalid: invalid };
}
