const fs = require("fs");
const { promisify } = require("util");

const _readFileP = promisify(fs.readFile);

function readTextFile(filename) {
  return _readFileP(filename, "utf8");
}

function co(generator) {
  return new Promise(resolve => {
    function recur({ value, done }) {
      if (done) {
        resolve(value);
      } else {
        Promise.resolve(value)
          .then(data => iter.next(data))
          .then(recur);
      }
    }
    recur(generator().next());
  });
}

co(function*() {
  console.log(yield readTextFile(__filename));
  return "done";
}).then(message => {
  console.log(`--- message[1]: ${message} ---`);
});

(async () => {
  console.log(await readTextFile(__filename));
  return "done";
})().then(message => {
  console.log(`--- message[2]: ${message} ---`);
});
