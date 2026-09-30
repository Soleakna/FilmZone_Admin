const fs = require("fs");
const file = "dist/assets/index-DipTVHSE.js";
const s = fs.readFileSync(file, "utf8");
const needle = "Seat already exists with SeatLabel";
let idx = s.indexOf(needle);
console.log("FOUND at:", idx);
if (idx >= 0) {
  const start = Math.max(0, idx - 4000);
  console.log("==== CTX BEFORE ====");
  console.log(s.substring(start, idx + needle.length + 2000));
}