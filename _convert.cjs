const { execSync } = require("child_process");
const { writeFileSync } = require("fs");
const buf = execSync('git --no-pager show main:src/pages/admin/AdminSeatsPage.jsx', {
  cwd: process.cwd(),
  maxBuffer: 50 * 1024 * 1024,
});
console.log("raw bytes:", buf.length);
console.log("bom?", buf[0], buf[1], buf[2]);
let text;
if (buf[0] === 0xff && buf[1] === 0xfe) {
  text = buf.toString("utf16-le");
} else if (buf[0] === 0xef && buf[1] === 0xbb) {
  text = buf.toString("utf8");
} else {
  text = buf.toString("utf8");
}
writeFileSync("_AdminSeatsPage.main.utf8.jsx", text);
console.log("chars:", text.length);