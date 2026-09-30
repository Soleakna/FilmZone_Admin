const fs = require("fs");
const s = fs.readFileSync("dist/assets/index-DipTVHSE.js", "utf8");
const WIDTH = 160;
const out = ["==== RANGE 855000-859350 ===="];
const chunk = s.substring(855000, 859350);
for (let i = 0; i < chunk.length; i += WIDTH) {
  out.push(String.fromCharCode(65 + (i / WIDTH) / 1).slice(0, 1) + "|" + String(i / WIDTH).padStart(4, "0") + ": " + chunk.substring(i, i + WIDTH));
}
fs.writeFileSync("_dist_state.txt", out.join("\n"));