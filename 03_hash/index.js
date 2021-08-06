const fetch = require("node-fetch");
const fs = require("fs").promises;
const crypto = require("crypto").createHash("sha256");

if (process.argv.length < 3) {
  return;
}

const url = process.argv[2];
const urlHash = url + ".sha256";
const remoteUrl = url.includes("http");

if (remoteUrl) {
  fetch(url)
    .then((res) => {
      if (res.status === 404) {
        throw "Not found file";
      }
      return res.buffer();
    })
    .then((data) => crypto.update(data).digest("hex"))
    .catch(() => process.exit(100))
    .then((hash) =>
      fetch(urlHash)
        .then((res) => {
          if (res.status === 404) {
            throw "Not found file";
          }
          return res.text();
        })
        .then((data) => {
          if (hash === data.trim()) {
            console.log("Checksum was match");
          } else {
            process.exit(102);
          }
        })
    )
    .catch(() => process.exit(101));
} else {
  fs.readFile(url)
    .then((data) => crypto.update(data).digest("hex"))
    .catch(() => process.exit(100))
    .then((hash) =>
      fs
        .readFile(urlHash)
        .then((data) => data.toString())
        .then((data) => {
          if (hash === data.trim()) {
            console.log("Checksum was match");
          } else {
            process.exit(102);
          }
        })
    )
    .catch(() => process.exit(101));
}
