function main() {
  const size = 32;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  canvas.style.width = size * 2 + "px";
  canvas.style.height = size * 2 + "px";
  const favicon = document.createElement("link");
  favicon.type = "image/png";
  favicon.rel = "icon";
  document.body.appendChild(canvas);
  document.head.appendChild(favicon);
  const context = canvas.getContext("2d");
  function loop() {
    const { width, height } = context.canvas;
    const t = f(Date.now());
    const color = `hsl(100, 100%, ${t}%)`;
    context.clearRect(0, 0, width, height);
    context.fillStyle = color;
    context.arc(width / 2, height / 2, width / 3, 0, 2 * Math.PI);
    context.fill();
    favicon.href = context.canvas.toDataURL("image/png");
    document.title = title(t);
    requestAnimationFrame(loop);
  }
  loop();
}

function title(t) {
  const n = 10;
  const x = n * (t / 100);
  return "#".repeat(x + 1);
}

function sin1(x) {
  return (1 + Math.sin(x * 2 * Math.PI)) / 2;
}

function f(x) {
  return 100 * sin1(x / 3000);
}

main();
