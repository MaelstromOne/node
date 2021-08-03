const currentDateTime = require("./date");

const datetime = currentDateTime();

console.log(`Today is ${datetime.date}, the current time is ${datetime.time}`);
