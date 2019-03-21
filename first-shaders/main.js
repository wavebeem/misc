const WIDTH = 640;
const HEIGHT = 480;

document.documentElement.style.setProperty("--GameWidth", `${WIDTH}px`);
document.documentElement.style.setProperty("--GameHeight", `${HEIGHT}px`);

const fragmentShader = `
varying vec2 vTextureCoord;
uniform sampler2D uSampler;

bool should_filter(vec4 c) {
  return c.a > 0.0 && c.rgb == c.brg;
}

vec3 red = vec3(1.0, 0.0, 0.0);
vec3 green = vec3(0.0, 1.0, 0.0);
vec3 blue = vec3(0.0, 0.0, 1.0);
vec3 yellow = vec3(1.0, 1.0, 0.0);

void main() {
  vec4 color = texture2D(uSampler, vTextureCoord);
  if (should_filter(color)) {
    if (color.r <= 0.0) {
      gl_FragColor = vec4(red, color.a);
    } else if (color.r <= 0.30) {
      gl_FragColor = vec4(blue, color.a);
    } else if (color.r <= 0.70) {
      gl_FragColor = vec4(green, color.a);
    } else if (color.r <= 1.0) {
      gl_FragColor = vec4(yellow, color.a);
    } else {
      gl_FragColor = color;
    }
  } else {
    gl_FragColor = color;
  }
}
`;

class Game {
  constructor() {
    this.app = new PIXI.Application({
      width: WIDTH,
      height: HEIGHT
    });
    this.app.view.classList.add("game");
    document.body.appendChild(this.app.view);

    this.dude1 = new PIXI.Sprite();
    this.dude1.texture = PIXI.Texture.from("./dude.png");
    this.dude1.position.set(0.5);
    this.dude1.x = 10;
    this.dude1.y = 20;
    const shader = new PIXI.Filter("", fragmentShader);
    this.dude1.filters = [shader];

    this.dude2 = new PIXI.Sprite();
    this.dude2.texture = PIXI.Texture.from("./dude.png");
    this.dude2.position.set(0.5);
    this.dude2.x = 60;
    this.dude2.y = 70;

    this.app.stage.addChild(this.dude1);
    this.app.stage.addChild(this.dude2);
    // this.app.stage.filters = [shader];
  }
}

new Game();
