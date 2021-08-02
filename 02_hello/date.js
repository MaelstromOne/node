function currentDateTime() {
  const datetime = new Date().toISOString().split("T");

  return {
    date: datetime[0],
    time: datetime[1].split(".")[0],
  };
}

module.exports = currentDateTime;
