async function main() {
  console.log("testlogger.js");
  console.log("got error", new Error("test error"));
  console.log(`dev: message`, { dev: "dev" });
  console.log(`dev: dev`, {
    dev: "dev",
  });
}

main().then(() => {
  process.exit();
});
