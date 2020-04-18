const speed = 12;
const boardLength = 17;
let WIDTH = 0;
let HEIGHT = 0;
let GRID_SIZE = 0;

window.addEventListener("load", () => {
  const canvasContainer = document.querySelector(".canvas-container");
  const canvas = document.querySelector("#canvas");
  const ctx = canvas.getContext("2d");
  const game = new Game(ctx);

  const resize = () => {
    let props = window.getComputedStyle(canvasContainer);
    let padding = parseFloat(props.padding.replace("px", ""));
    WIDTH = parseFloat(props.width.replace("px", "")) - 2 * padding;
    HEIGHT = parseFloat(props.height.replace("px", "")) - 2 * padding;
    GRID_SIZE = WIDTH / boardLength;
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
  };

  window.addEventListener("resize", resize);
  window.addEventListener("keydown", game.handleInput);

  resize();
  runEngine(speed, game.update);
});

function Game(ctx) {
  this.player = new Player(2, 13);
  this.food = new Food();
  this.score = 0;

  this.updateScore = () => {
    let scoreElement = document.querySelector("#score");
    scoreElement.innerHTML = this.score;
  };

  this.reset = () => {
    this.score = 0;
    this.player.reset();
    this.food.reset([this.player.pos, ...this.player.tails]);
    this.updateScore();
  };

  this.draw = () => {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    ctx.globalAlpha = 1;

    //draw grid
    ctx.beginPath();
    ctx.strokeStyle = "white";
    ctx.lineWidth = 1.5;
    let index = 1;
    while (index * GRID_SIZE < WIDTH) {
      let pos = index * GRID_SIZE;
      ctx.moveTo(pos, 0);
      ctx.lineTo(pos, HEIGHT);
      ctx.moveTo(0, pos);
      ctx.lineTo(WIDTH, pos);
      index++;
    }
    ctx.stroke();
    //end grid

    this.food.draw(ctx);
    this.player.draw(ctx);
  };

  this.update = () => {
    this.draw();
    this.player.update();

    if (
      this.player.pos.x < 0 ||
      this.player.pos.x >= boardLength ||
      this.player.pos.y < 0 ||
      this.player.pos.y >= boardLength ||
      !this.player.isAlive()
    ) {
      this.reset();
    }

    if (
      this.player.pos.x == this.food.pos.x &&
      this.player.pos.y == this.food.pos.y
    ) {
      this.score++;
      this.updateScore();

      this.player.tails.push({ ...this.food.pos });
      this.food.reset([this.player.pos, ...this.player.tails]);
    }
  };

  this.handleInput = ({ keyCode }) => {
    let move = { x: 0, y: 0 };
    switch (getInput(keyCode)) {
      case "left":
        move.x = -1;
        break;
      case "right":
        move.x = 1;
        break;
      case "up":
        move.y = -1;
        break;
      case "down":
        move.y = 1;
        break;
    }
    this.player.setMove(move.x, move.y);
  };

  this.reset();
}

function Player(originX, originY) {
  this.move = { x: 0, y: 0 };
  this.pos = { x: 0, y: 0 };
  this.tails = [];

  this.reset = () => {
    this.pos.x = originX;
    this.pos.y = originY;
    this.move.x = 0;
    this.move.y = 0;
    this.tails = [];
  };

  this.isAlive = () => {
    return this.tails.every(
      (tailPos) => tailPos.x != this.pos.x || tailPos.y != this.pos.y
    );
  };

  this.setMove = (x, y) => {
    if ((this.move.x == 0 && x !== 0) || (this.move.y == 0 && y !== 0)) {
      this.move.x = x;
      this.move.y = y;
    }
  };

  this.draw = (ctx) => {
    let { x, y } = coordinatesToPos(this.pos);
    ctx.fillStyle = "#0F9D58";
    ctx.globalAlpha = 1;
    ctx.fillRect(x, y, GRID_SIZE, GRID_SIZE);

    let minOpacity = this.tails.length > 3 ? 0.25 : 0.5;
    let fade = (1 - minOpacity) / this.tails.length;
    let currOpacity = 1 - fade;
    for (tail of this.tails) {
      let { x, y } = coordinatesToPos(tail);
      ctx.globalAlpha = currOpacity;
      ctx.fillRect(x, y, GRID_SIZE, GRID_SIZE);
      currOpacity -= fade;
    }
  };

  this.update = () => {
    if (this.tails.length > 0 && (this.move.x != 0 || this.move.y != 0)) {
      this.tails = this.tails.splice(0, this.tails.length - 1);
      this.tails.unshift({ ...this.pos });
    }
    this.pos.x += this.move.x;
    this.pos.y += this.move.y;
  };
}

function Food() {
  this.pos = { x: 0, y: 0 };
  this.auraMax = [0.65, 1];
  this.auraOpacity = [0.3, 0.2];
  this.aura = [0, 0];
  this.auraDirection = [1, 1];

  this.reset = (playerPos) => {
    let newPos = { x: 0, y: 0 };
    do {
      newPos.x = Math.floor(Math.random() * (boardLength - 1));
      newPos.y = Math.floor(Math.random() * (boardLength - 1));
    } while (
      playerPos.some(
        (snakePos) => snakePos.x == newPos.x && snakePos.y == newPos.y
      )
    );
    this.pos = newPos;
  };

  this.draw = (ctx) => {
    let { x, y } = coordinatesToPos(this.pos);
    ctx.fillStyle = "#DB4437";
    ctx.fillRect(
      x + (GRID_SIZE * 0.45) / 2,
      y + (GRID_SIZE * 0.45) / 2,
      GRID_SIZE * 0.55,
      GRID_SIZE * 0.55
    );
    this.aura = this.aura.map((aura, index) => {
      ctx.globalAlpha = this.auraOpacity[index];
      ctx.fillRect(
        x + (GRID_SIZE * (1 - aura)) / 2,
        y + (GRID_SIZE * (1 - aura)) / 2,
        GRID_SIZE * aura,
        GRID_SIZE * aura
      );
      if (aura + 0.1 > this.auraMax[index]) {
        this.auraDirection[index] = 0;
      }
      if (aura - 0.1 < 0.5) {
        this.auraDirection[index] = 1;
      }
      return this.auraDirection[index] ? aura + 0.1 : aura - 0.1;
    });
  };
}

function runEngine(fps, game) {
  let previousTimestamp = 0;
  let last = 0;

  let update = (timestamp) => {
    let delta = timestamp - previousTimestamp;
    previousTimestamp = timestamp;
    last += delta;

    if (last >= 1000 / fps) {
      game();
      last = 0;
    }

    window.requestAnimationFrame(update);
  };
  window.requestAnimationFrame(update);
}

function getInput(keyCode) {
  if (keyCode == 37 || keyCode == 65) return "left";

  if (keyCode == 39 || keyCode == 68) return "right";

  if (keyCode == "38" || keyCode == 87) return "up";

  if (keyCode == "40" || keyCode == "83") return "down";
}

function coordinatesToPos(pos) {
  return { x: GRID_SIZE * pos.x, y: GRID_SIZE * pos.y };
}
