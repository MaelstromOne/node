const fetch = require("node-fetch");
const fs = require("fs").promises;
const crypto = require("crypto").createHash("sha256");

if (process.argv.length < 3) {
  return;
}

checkHash(process.argv[2]);

function checkHash(url) {
  const urlHash = url + ".sha256";
  const remoteUrl = url.includes("http");
  const getHashes = remoteUrl ? getHashesFromRemoteUrl : getHashesFromLocaleUrl;

  getHashes(url, urlHash)
    .then((hash) => {
      if (hash[0] === hash[1]) {
        console.log("Checksum was match");
      } else {
        process.exit(102);
      }
    })
}

async function getHashesFromRemoteUrl(url, urlHash) {
  return await Promise.all([
    fetch(url)
      .then((res) => {
        if (res.status === 404) {
          throw "Not found file";
        }
        return res.buffer();
      })
      .then((data) => crypto.update(data).digest("hex"))
      .catch(() => process.exit(100)),
    fetch(urlHash)
      .then((res) => {
        if (res.status === 404) {
          throw "Not found file";
        }
        return res.text();
      })
      .then(text => text.trim())
      .catch(() => process.exit(101))
  ])
}

async function getHashesFromLocaleUrl(url, urlHash) {
  return await Promise.all([
    fs.readFile(url)
      .then((data) => crypto.update(data).digest("hex"))
      .catch(() => process.exit(100)),
    fs.readFile(urlHash)
      .then((data) => data.toString().trim())
      .catch(() => process.exit(101))
  ])
}
