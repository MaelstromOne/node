const os = require("os");
const path = require("path");
const fs = require("fs/promises");
const axios = require('axios')
const { printTimers } = require("./cli");

const homeDir = os.homedir();
const isWindows = os.type().match(/windows/i);
const sessionFileName = path.join(homeDir, `${isWindows ? "_" : "."}sb-timers-session`);

require("dotenv").config();

function login(username, password) {
  return axios.post(process.env.SERVER + '/login', {
    username,
    password
  }).then(responce => responce.data)
    .then(data => {
      if (data.hasOwnProperty('error')) {
        throw data.error;
      }
      return data
    })
    .then(data => JSON.stringify(data))
    .then(data => fs.writeFile(sessionFileName, data, 'utf8'))
    .then(() => console.log("Logged in successfully!"))
    .catch(e => console.log(e))
}

function signup(username, password) {
  return axios.post(process.env.SERVER + '/signup', {
    username,
    password
  }).then(responce => responce.data)
    .then(data => {
      if (data.hasOwnProperty('error')) {
        throw data.error;
      }
      return data
    })
    .then(data => JSON.stringify(data))
    .then(data => fs.writeFile(sessionFileName, data, 'utf8'))
    .then(() => console.log("Signed up successfully!"))
    .catch(e => console.log(e))
}

function logout() {
  return axios.get(process.env.SERVER + '/logout')
    .then(response => response.data)
    .then(() => fs.unlink(sessionFileName))
    .then(() => console.log("Logged out successfully!"))
    .catch(e => {
      if (e.code === 'ENOENT') {
        console.log('You are not authorized')
      }
    });
}

function status(param) {
  if (isNumeric(param)) {
    statusOne(param)
  } else if (param === 'old') {
    statusAll(false)
  } else {
    statusAll(true);
  }
}

function statusAll(isActive) {
  return fs.readFile(sessionFileName, 'utf8')
    .then(data => JSON.parse(data))
    .then(data =>
      axios.get(process.env.SERVER + '/api/timers', {
        params: {
          isActive
        },
        headers: {
          sessionId: data['sessionId']
        }
      })).then(response => response.data)
    .then(data => printTimers(data))
    .catch(e => {
      if (e.code === 'ENOENT') {
        console.log('You are not authorized')
      }
    });
}

function statusOne(id) {
  return fs.readFile(sessionFileName, 'utf8')
    .then(data => JSON.parse(data))
    .then(data =>
      axios.get(process.env.SERVER + `/api/timers/${id}`, {
        headers: {
          sessionId: data['sessionId']
        }
      })).then(response => response.data)
    .then(data => printTimers([data]))
    .catch(e => {
      if (e.code === 'ENOENT') {
        console.log('You are not authorized')
      }
    });
}

function start(description) {
  return fs.readFile(sessionFileName, 'utf8')
    .then(data => JSON.parse(data))
    .then(data =>
      axios.post(process.env.SERVER + '/api/timers', {
        description
      }, {
        headers: {
          sessionId: data['sessionId']
        }
      })).then(response => response.data)
    .then(data => console.log(`Started timer "${description}", ID: ${data.id}.`))
    .catch(e => {
      if (e.code === 'ENOENT') {
        console.log('You are not authorized')
      }
    });
}

function stop(id) {
  console.log(process.env.SERVER + `/api/timers/${id}/stop`)
  return fs.readFile(sessionFileName, 'utf8')
    .then(data => JSON.parse(data))
    .then(data => axios.post(process.env.SERVER + `/api/timers/${id}/stop`, {}, {
      headers: {
        sessionId: data['sessionId']
      }
    })).then(() => console.log(`Timer ${id} stopped.`))
    .catch(e => {
      if (e.code === 'ENOENT') {
        console.log('You are not authorized')
      }
    });
}

function isNumeric(num) {
  return !isNaN(num)
}

module.exports = {login, signup, logout, status, start, stop};
