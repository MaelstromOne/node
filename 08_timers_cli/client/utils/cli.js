const Table = require('cli-table')
const inquirer = require("inquirer")

const table = new Table({
  head: ["ID", "Task", "Time"],
  colWidths: [10, 40, 15]
})

const questions = [
  { type: "input", name: "username", message: "Username:" },
  { type: "password", name: "password", message: "Password:" }
]


function printTimers(timers) {
  timers.forEach(timer => {
    const duration = timer.duration === null ? timer.progress : timer.duration;
    table.push([timer.id, timer.description, formatDuration(duration)])
  })
  console.log(table.toString())
}

function formatDuration(d) {
  d = Math.floor(d / 1000);
  const s = d % 60;
  d = Math.floor(d / 60);
  const m = d % 60;
  const h = Math.floor(d / 60);
  return [h > 0 ? h : null, m, s]
    .filter((x) => x !== null)
    .map((x) => (x < 10 ? "0" : "") + x)
    .join(":");
}

function loginPrompt() {
  return inquirer.prompt(questions)
}

module.exports = { printTimers, loginPrompt };
