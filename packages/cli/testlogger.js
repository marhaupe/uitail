const fs = require("fs");

async function main() {
  console.log("testlogger.js");
  console.log("error", new Error("test error"));
  console.log(`dev: object`, { dev: "dev" });
  console.log(`dev: array`, [1, 2, 3, 4]);
  console.log(`dev: largeobject`, {
    a: "dev",
    b: "dev",
    c: "dev",
    d: "dev",
    e: "dev",
    f: "dev",
    g: "dev",
  });
  const data = fs.readFileSync("data.json", "utf8");
  console.log(`dev: large string`, data);
}

console.log(`🚀 running script now`);
main().then(() => {
  console.log("✅ done");
});
