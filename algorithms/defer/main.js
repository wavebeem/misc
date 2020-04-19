function defer() {
  const api = {};
  api.promise = new Promise((resolve, reject) => {
    api.resolve = resolve;
    api.reject = reject;
  });
  return api;
}

const d = defer();

setTimeout(d.resolve, 1000);

console.log("Wait for it...");
d.promise.then(() => {
  console.log("Done!");
});
