document.addEventListener("DOMContentLoaded", () => {
  const bird = document.querySelector(".bird");
  const game_screen = document.querySelector(".game-container");
  const ground = document.querySelector(".ground");

  let birdLeft = 220;
  let birdBottom = 100;
  let gravity = 2;
  let isGameOver = false;

  function startGame() {
    if (birdBottom > 0) birdBottom -= gravity;
    bird.style.bottom = birdBottom + "px";
    bird.style.left = birdLeft + "px";
  }
  let gameTimer = setInterval(startGame, 20);

  function control(e) {
    if (e.keyCode === 32) {
      jump();
    }
  }

  function jump() {
    if (birdBottom < 500) birdBottom += 50;
    bird.style.bottom = birdBottom + "px";
    console.log(birdBottom);
  }
  document.addEventListener("keyup", control);

  function generatePipe() {
    let pipeLeft = 500;
    let randomHeight = Math.random() * 50;
    let pipeBottom = randomHeight;
    let gap = 450;
    const pipe = document.createElement("div");
    const topPipe = document.createElement("div");

    if (!isGameOver) {
      pipe.classList.add("pipe");
      topPipe.classList.add("topPipe");
    }

    game_screen.appendChild(pipe);
    game_screen.appendChild(topPipe);
    pipe.style.left = pipeLeft + "px";
    pipe.style.bottom = pipeBottom + "px";
    topPipe.style.left = pipeLeft + "px";
    topPipe.style.bottom = pipeBottom + gap + "px";

    function movePipe() {
      pipeLeft -= 2;
      pipe.style.left = pipeLeft + "px";
      topPipe.style.left = pipeLeft + "px";

      if (pipeLeft === -60) {
        clearInterval(pipeTimer);
        game_screen.removeChild(pipe);
        game_screen.removeChild(topPipe);
      }

      if (
          pipeLeft > 230 &&
          pipeLeft < 280 &&
          birdLeft === 220 &&
          (birdBottom < pipeBottom + 153 || birdBottom > pipeBottom + gap - 200) ||
          birdBottom === 0
      ) {
        gameOver();
        clearInterval(pipeTimer);
      }
    }
    let pipeTimer = setInterval(movePipe, 20);
    if (!isGameOver) setTimeout(generatePipe, 3000);
  }
  generatePipe();

  function gameOver() {
    clearInterval(gameTimer);
    isGameOver = true;
    document.removeEventListener("keyup", control);
  }
});
