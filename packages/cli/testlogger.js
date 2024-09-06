const fs = require("fs");

async function main() {
  console.log("testlogger.js");
  const data = fs.readFileSync("data.json", "utf8");
  console.log(`dev: large string`, data);
  while (true) {
    console.log(`dev: object`, { dev: "dev" });
    console.log(`dev: array`, [1, 2, 3, 4]);
    console.log(
      `dev: large array`,
      [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]
    );
    console.log(`dev: largeobject`, {
      a: "dev",
      b: "dev",
      c: "dev",
      d: "dev",
      e: "dev",
      f: "dev",
      g: "dev",
    });
    console.log("error", new Error("test error"));
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}

console.log(`🚀 running script now`);
main().then(() => {
  console.log("✅ done");
});
