const fs = require("fs");

async function main() {
  while (true) {
    console.log("testlogger.js");
    console.log("got error", new Error("test error"));
    console.log(`dev: message`, { dev: "dev" });

    console.log(`dev: dev`, {
      a: "dev",
      b: "dev",
      c: "dev",
      d: "dev",
      e: "dev",
      f: "dev",
      g: "dev",
    });
    await new Promise((resolve) => setTimeout(resolve, Math.random() * 30000));
  }
}

// const data = fs.readFileSync("data.json", "utf8");
// console.log(`dev: data`, data);
main().then(() => {
  console.log("done");
});
