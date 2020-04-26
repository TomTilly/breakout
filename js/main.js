// Tracks if right or left key is currently pressed
const keyState = {
  rightArrowDown: false,
  leftArrowDown: false,
  space: false,
  onKeydown(e) {
    if (e.code === 'ArrowRight') {
      this.rightArrowDown = true;
    } else if (e.code === 'ArrowLeft') {
      this.leftArrowDown = true;
    } else if (e.code === 'Space') {
      this.space = true;
    }
  },
  onKeyup(e) {
    if (e.code === 'ArrowRight') {
      this.rightArrowDown = false;
    } else if (e.code === 'ArrowLeft') {
      this.leftArrowDown = false;
    } else if (e.code === 'Space') {
      this.space = false;
    }
  },
};

document.addEventListener('keydown', keyState.onKeydown.bind(keyState));
document.addEventListener('keyup', keyState.onKeyup.bind(keyState));


class Entity {
  constructor(xOrigin, yOrigin, width, height, color) {
    this._x = xOrigin;
    this._y = yOrigin;
    this.width = width;
    this.height = height;
    this.top = yOrigin;
    this.left = xOrigin;
    this.right = xOrigin + width;
    this.bottom = yOrigin + height;
    this.color = color;
  }

  get x() {
    return this._x;
  }

  set x(value) {
    this._x = value;
    this.right = this._x + this.width;
    this.left = this._x;
  }

  get y() {
    return this._y;
  }

  set y(value) {
    this._y = value;
    this.top = this._y;
    this.bottom = this._y + this.height;
  }

  draw(ctx) {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }
}

class Brick extends Entity {
  constructor(xOrigin, yOrigin, width, height, color, health, col, row) {
    super(xOrigin, yOrigin, width, height, null);
    this.color = color;
    this.health = health;
    this.row = row;
    this.col = col;
  }

  draw(ctx) {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.fillStyle = 'rgba(0,0,0,0.1)';
    ctx.fillRect(this.x + 2, this.y + 2, this.width - 4, this.height - 4);
  }

  decreaseHealth() {
    this.health -= 1;
  }

  isDead() {
    if (this.health === 0) {
      return true;
    }
    return false;
  }
}

class Paddle extends Entity {
  constructor(xOrigin, yOrigin, width, height, color, speed) {
    super(xOrigin, yOrigin, width, height, color);
    this.dx = speed;
  }

  // Updates position (includes checking for collisions and correcting)
  // * game parameter is the game object where the paddle is being updated
  update(game) {
    if (keyState.leftArrowDown) {
      this.x -= this.dx;
    }
    if (keyState.rightArrowDown) {
      this.x += this.dx;
    }

    // Check bounds collision
    const boundsCollisions = game.isOutsideBounds(this, ['left', 'right']);
    if (boundsCollisions) {
      if (boundsCollisions.left) {
        this.x = 0;
      }
      if (boundsCollisions.right) {
        this.x = game.canvas.width - this.width;
      }
    }
  }
}

class Ball extends Entity {
  constructor(xOrigin, yOrigin, width, height, color, speed) {
    super(xOrigin, yOrigin, width, height, color);
    this.dx = Math.abs(speed);
    this.dy = -(Math.abs(speed));
  }

  update(game) {
    if (!game.hasStarted) { // game hasn't started yet, tether ball to paddle center
      this.x = game.paddle.x + (game.paddle.width / 2);
      return;
    }
    // game has started, update as usual
    this.x += this.dx;
    this.y += this.dy;


    // Check bounds collision
    const boundsCollisions = game.isOutsideBounds(this, ['top', 'right', 'bottom', 'left']);
    if (boundsCollisions) {
      if (boundsCollisions.top) {
        this.y = 0;
        this.dy = -this.dy;
      }
      if (boundsCollisions.right) {
        this.x = game.canvas.width - this.width;
        this.dx = -this.dx;
      }
      if (boundsCollisions.bottom) {
        this.y = game.canvas.height - this.height;
        this.dy = -this.dy;
      }
      if (boundsCollisions.left) {
        this.x = 0;
        this.dx = -this.dx;
      }
    }

    // Check paddle collision
    if (game.isColliding(this, game.paddle)) {
      switch (game.getCollisionSide(this, game.paddle, this.dx, this.dy)) {
        case 'top':
          this.y = game.paddle.top - this.height;
          this.dy = -this.dy;
          break;
        case 'right':
          this.x = game.paddle.left - this.width;
          this.dx = -this.dx;
          break;
        case 'bottom':
          console.log('paddleBottom');
          this.y = game.paddle.bottom;
          this.dy = -this.dy;
          break;
        case 'left':
          this.x = game.paddle.right;
          this.dx = -this.dx;
          break;
        default:
          console.warn('default case run in switch statement of ball.update() function');
          break;
      }
    }

    // Check brick collision
    game.bricks.forEach((brick) => {
      if (game.isColliding(this, brick)) {
        debugger;
        console.log(brick);
        switch (game.getCollisionSide(this, brick, this.dx, this.dy)) {
          case 'top':
            this.y = brick.top - this.height;
            this.dy = -this.dy;
            break;
          case 'right':
            this.x = brick.right;
            this.dx = -this.dx;
            break;
          case 'bottom':
            this.y = brick.bottom;
            this.dy = -this.dy;
            break;
          case 'left':
            this.x = brick.left - this.width;
            this.dx = -this.dx;
            break;
          default:
            console.warn('default case run in switch statement of ball.update() function');
            break;
        }
      }
    });
  }
}

class Game {
  constructor(brickTheme) {
    this.canvas = document.querySelector('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.canvas.width = 1016;
    this.canvas.height = 762;
    this.horizontalGamePadding = 5;
    this.verticalGamePadding = 60;
    this.brickPadding = 2;
    this.brickWidth = 70;
    this.brickHeight = 15;
    this.paddleWidth = 100;
    this.paddleHeight = 15;
    this.paddleSpeed = 10;
    this.paddleColor = 'white';
    this.ballWidth = 10;
    this.ballHeight = 10;
    this.ballSpeed = 2;
    this.ballColor = '#76aef2';
    this.hasStarted = false;
    this.themeOptions = {
      standard: ['#94F377', '#FFFA7D', '#FFC77D', '#FF837D'],
      funky: ['#FFF632', '#9AF12F', '#E92D79', '#8533CB'],
    };
    this.brickTheme = this.themeOptions[brickTheme];
    this.currentLevel = 1;
    this.level = [
      [0, 0, 0, 0, 0, 0, 0, 0, 4, 4, 4, 4, 4, 4],
      [0, 0, 0, 0, 0, 0, 0, 0, 4, 4, 4, 4, 4, 4],
      [0, 0, 0, 0, 0, 0, 0, 0, 3, 3, 3, 3, 3, 3],
      [0, 0, 0, 0, 0, 0, 0, 0, 3, 3, 3, 3, 3, 3],
      [0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 2, 2, 2, 2],
      [0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 2, 2, 2, 2],
      [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1],
      [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1],
    ];
    this.paddle = new Paddle((this.canvas.width / 2) - (this.paddleWidth / 2), this.canvas.height - this.verticalGamePadding, this.paddleWidth, this.paddleHeight, this.paddleColor, this.paddleSpeed);
    this.ball = new Ball((this.canvas.width / 2), this.canvas.height - this.verticalGamePadding - this.paddle.height - (this.ballHeight - this.paddle.height), this.ballWidth, this.ballHeight, this.ballColor, this.ballSpeed);
  }

  /* Builds all bricks for a level, according to the following key
   * Level Key
   * 4 = red, 4 health
   * 3 = orange, 3 health
   * 2 = yellow, 2 health
   * 1 = green, 1 health
   * 0 = empty space
  * */
  buildBricks(xOrigin, yOrigin) {
    const bricks = [];
    for (let i = 0; i < this.level.length; i += 1) {
      for (let j = 0; j < this.level[i].length; j += 1) {
        const x = (this.brickWidth * j) + (this.brickPadding * j) + this.horizontalGamePadding + xOrigin;
        const y = (this.brickHeight * i) + (this.brickPadding * i) + this.verticalGamePadding + yOrigin;
        const color = this.brickTheme[this.level[i][j] - 1];
        const health = this.level[i][j];
        if (health) { // if > 0
          const newBrick = new Brick(x, y, this.brickWidth, this.brickHeight, color, health, j + 1, i + 1);
          bricks.push(newBrick);
        }
      }
    }
    this.bricks = bricks;
  }

  isOutsideBounds(entity, sidesToCheck) {
    const results = {};
    sidesToCheck.forEach((side) => {
      switch (side) {
        case 'top':
          results.top = entity.top < 0;
          break;
        case 'right':
          results.right = entity.right > this.canvas.width;
          break;
        case 'bottom':
          results.bottom = entity.bottom > this.canvas.height;
          break;
        case 'left':
          results.left = entity.left < 0;
          break;
        default:
          console.warn('isOutsideBounds switch statement default case run');
          break;
      }
    });
    if (results.top || results.right || results.bottom || results.left) {
      return results;
    }
    return false;
  }

  isColliding(entity1, entity2) {
    return (
      entity1.top < entity2.bottom
      && entity1.bottom > entity2.top
      && entity1.left < entity2.right
      && entity1.right > entity2.left
    );
  }

  // returns the side of entity1 that collided
  // e stands for entity
  getCollisionSide(ball, entity, dx, dy) {
    const xmax = (ball.right > entity.right) ? entity.right : ball.right;
    const xmin = (ball.left < entity.left) ? entity.left : ball.left;
    const ymax = (entity.top > ball.top) ? entity.top : ball.top;
    const ymin = (entity.bottom < ball.bottom) ? entity.bottom : ball.bottom;
    const xCross = xmax - xmin;
    const yCross = ymax - ymin;

    console.info('new run');
    if (xCross > yCross) { // top or bottom
      if (dy > 0) {
        return 'top';
        console.log('dy', dy);
        console.log('top');
      }
      console.log('bottom');
      console.log('dy', dy);
      return 'bottom';
    } // left or right
    if (dx > 0) {
      console.log('right');
      return 'right';
    }
    console.log('left');
    return 'left';
  }

  update() {
    this.paddle.update(this);
    this.ball.update(this);
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.bricks.forEach((brick) => {
      brick.draw(this.ctx);
    });
    this.paddle.draw(this.ctx);
    this.ball.draw(this.ctx);
  }
}


const game = new Game('standard');
game.buildBricks(0, 0);
function main(timeStamp = null) {
  // update
  if (keyState.space) {
    game.hasStarted = true;
  }
  game.update();

  // draw
  game.draw();
  game.frameID = window.requestAnimationFrame(main);
}

window.requestAnimationFrame(main);
