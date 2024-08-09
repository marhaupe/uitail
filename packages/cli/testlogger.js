const fs = require("fs");

console.log("testlogger.js");
console.log("got error", new Error("test error"));
console.log(`dev: message`, { dev: "dev" });
console.log(`dev: dev`, {
  dev: "dev",
});
const data = fs.readFileSync("data.json", "utf8");
console.log(`dev: data`, data);
