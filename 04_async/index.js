const fetch = require("node-fetch");

const API = "https://swapi.dev/api/people/?search=";

if (process.argv.length < 3) {
  console.log("Нет ни одного аргумента");
  process.exit();
}

const searches = process.argv.splice(2);

getResultsFromApi(searches)
  .then((data) => data.reduce((accumulator, value) => accumulator.concat(value), []))
  .then((data) => {
    if (data.length === 0) return;
    console.log("Total results:", data.length);
    console.log(
      "All:",
      data
        .map((value) => value.name)
        .sort()
        .join(", ")
    );

    const minHeight = data.reduce((accumulator, value) => {
      return parseInt(accumulator.height) < parseInt(value.height) ? accumulator : value;
    });
    console.log("Min height:", minHeight.name, ",", minHeight.height, "cm");

    const maxHeight = data.reduce((accumulator, value) => {
      return parseInt(accumulator.height) > parseInt(value.height) ? accumulator : value;
    });
    console.log("Max height:", maxHeight.name, ",", maxHeight.height, "cm");
  });

async function getResultsFromApi(searches) {
  return await Promise.all(
    searches.map((search) =>
      fetch(API + search)
        .then((responce) => responce.json())
        .then((data) => {
          if (data.count === 0) {
            console.log(`No results found for '${search}'`);
          }
          return data.results;
        })
        .catch((err) => {
          console.log("Ошибка подключения:", err.errno);
          return [];
        })
    )
  );
}
