/**
 * Prints the text drawn in a PDF, by inflating its content streams and pulling
 * out the string operands. Enough to confirm an invoice says what it should
 * without needing a PDF viewer.
 *
 *   node scripts/inspect-pdf.mjs invoice.pdf
 */
import { readFileSync } from "node:fs";
import { inflateSync } from "node:zlib";

const buf = readFileSync(process.argv[2]);
let out = "";

// Walk every "stream ... endstream" span and inflate the ones that are Flate.
let i = 0;
while ((i = buf.indexOf("stream", i)) !== -1) {
  let start = i + 6;
  if (buf[start] === 0x0d) start++;
  if (buf[start] === 0x0a) start++;
  const end = buf.indexOf("endstream", start);
  if (end === -1) break;
  try {
    out += inflateSync(buf.subarray(start, end)).toString("latin1") + "\n";
  } catch {
    // not a deflate stream (fonts, metadata) - skip
  }
  i = end + 9;
}

/*
 * PDFKit emits text as hex strings inside TJ arrays, e.g.
 *   [<7375745261> 0] TJ
 * with kerning numbers between the runs. Collect each BT..ET block and decode
 * every <hex> and (literal) run inside it, so one line of the invoice comes
 * back as one line here.
 */
const lines = [];
for (const block of out.matchAll(/BT([\s\S]*?)ET/g)) {
  let line = "";
  for (const run of block[1].matchAll(/<([0-9A-Fa-f\s]*)>|\(((?:[^()\\]|\\.)*)\)/g)) {
    line += run[1] !== undefined
      ? Buffer.from(run[1].replace(/\s/g, ""), "hex").toString("latin1")
      : run[2].replace(/\\([()\\])/g, "$1");
  }
  if (line.trim()) lines.push(line);
}

console.log(lines.join("\n"));
