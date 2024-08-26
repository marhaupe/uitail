const fs = require("fs");

async function main() {
  while (true) {
    console.log("testlogger.js");
    console.log("got error", new Error("test error"));
    console.log(`dev: message`, { dev: "dev" });
    console.log(`dev: dev`, {
      dev: "dev",
    });
    await new Promise((resolve) => setTimeout(resolve, Math.random() * 4000));
  }
}

const data = fs.readFileSync("data.json", "utf8");
console.log(`dev: data`, data);
main().then(() => {
  console.log("done");
});
