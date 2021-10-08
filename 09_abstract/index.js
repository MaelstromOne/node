console.log("OK")

let needCleanup = true;

process.on("beforeExit", () => {
    console.log(("About to exit"));
    if (needCleanup)
    setTimeout(() => {
        console.log("Some more work to do");
        needCleanup = false;
    }, 200)
})


process.on("exit", () => {
    console.log(("Exiting"));
})