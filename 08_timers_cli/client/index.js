const {loginPrompt} = require("./utils/cli");
const {login, signup, logout, status, start, stop} = require("./utils/request");

async function main() {
  const args = require("yargs").argv["_"];
  
  switch (args[0]) {
    case "login": {
      let {username, password} = await loginPrompt();
      await login(username, password);
      break;
    }
    case "signup": {
      let {username, password} = await loginPrompt();
      await signup(username, password);
      break;
    }
    case "logout":
      await logout();
      break;
    case "status":
      await status(args[1]);
      break;
    case "start":
      await start(args[1]);
      break;
    case "stop":
      await stop(args[1]);
      break;
  }
}

main();
