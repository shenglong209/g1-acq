/**
* g1-acq.js - Google One subscription page product ID mapping (Shadowrocket http-response script)

*

* Design principle:

* one. Single responsibility - only do the string mapping of "original monthly payment ID → discount file ID", without diagnosis or reporting;

* two. Catalog perception - first collect the real preferential file (acq ending) and target file from the original response text

* When it is not in the catalog and the spare file is in the catalog, it will automatically fall to the backup gear to avoid pointing the cash register to empty goods;

* three. Data external - All mappings are concentrated in the two tables of SKU_MAP / FALLBACK, and only the table is changed by adding or deleting gears.

*

* Version: v6
 */
"use strict";

console.log("[g1-acq] v6 loaded");

/* Original iOS in-app purchase ID → target discount file */
var SKU_MAP = {
  "g1.ios.20tb.m.v2":     "g1.20tb.3months_ip_90p.acq",
  "g1.ios.30tb.ai.pro.m": "g1.ai.ultra.3months_ip_90p.acq"
};

/* Backup files when the target file is not in the directory (community actual measurement 75p files appear in the Play/iOS directory) */
var FALLBACK = {
  "g1.20tb.3months_ip_90p.acq":     "g1.20tb.3months_ip_75p.acq",
  "g1.ai.ultra.3months_ip_90p.acq": "g1.ai.ultra.3months_ip_75p.acq"
};

function occurrences(s, needle) {
  return needle ? s.split(needle).length - 1 : 0;
}

function run() {
  var body = $response && $response.body;
  if (typeof body !== "string" || body === "") {
    $done({});
    return;
  }

  /* The real discount file catalog in the response */
  var raw = body.match(/g1\.[a-z0-9._]{2,60}acq/g) || [];
  var seen = {};
  var catalog = [];
  for (var r = 0; r < raw.length; r++) {
    if (!seen[raw[r]]) { seen[raw[r]] = 1; catalog.push(raw[r]); }
  }
  console.log("[g1-acq] Catalog discount file: " + (catalog.join(", ") || "无"));

  var out = body, total = 0;
  var froms = Object.keys(SKU_MAP);
  for (var k = 0; k < froms.length; k++) {
    var from = froms[k];
    var n = occurrences(out, from);
    if (n === 0) continue;

    var to = SKU_MAP[from];
    if (catalog.indexOf(to) === -1 && FALLBACK[to] && catalog.indexOf(FALLBACK[to]) !== -1) {
      console.log("[g1-acq] The main file is not in the directory, downgrade " + to + " -> " + FALLBACK[to]);
      to = FALLBACK[to];
    }

    out = out.split(from).join(to);
    total += n;
    console.log("[g1-acq] " + from + " -> " + to + " x" + n);
  }

  console.log(total ? "[g1-acq] 共改写 " + total + " 处" : "[g1-acq] 未命中");
  $done(total ? { body: out } : {});
}

run();
