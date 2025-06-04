// Hand Pose Detection with ml5.js
// https://thecodingtrain.com/tracks/ml5js-beginners-guide/ml5/hand-pose

let video;
let handPose;
let hands = [];
let cnv;

// 教育科技相關與不相關詞彙資料表
const eduTechWords = [
  { word: "數位教材", correct: true, desc: "數位教材是教育科技的重要應用，提升學習互動性。" },
  { word: "教學設計", correct: true, desc: "教學設計結合科技，優化學習流程與成效。" },
  { word: "學習科技", correct: true, desc: "學習科技促進個人化與自主學習。" },
  { word: "多媒體教學", correct: true, desc: "多媒體教學豐富課堂內容，提升學習動機。" },
  { word: "AI輔助教學", correct: true, desc: "AI輔助教學是教育科技的前沿應用。" },
  { word: "遊戲化學習", correct: true, desc: "遊戲化學習提升學習趣味與參與度。" },
  { word: "會計審核", correct: false, desc: "會計審核屬於商業管理領域，與教育科技無直接關聯。" },
  { word: "冰箱修理", correct: false, desc: "冰箱修理屬於家電維修，與教育科技無直接關聯。" },
  { word: "電焊", correct: false, desc: "電焊屬於工業技術，與教育科技無直接關聯。" },
  { word: "鍋爐工程", correct: false, desc: "鍋爐工程屬於機械工程，與教育科技無直接關聯。" }
];

// 掉落詞語物件類別
class FallingWord {
  constructor(data) {
    this.word = data.word;
    this.correct = data.correct;
    this.desc = data.desc;
    this.x = random(60, 580);
    this.y = -30;
    this.speed = random(0.8, 1.5);
    this.caught = false;
  }
  update() {
    this.y += this.speed;
  }
  display() {
    fill(this.correct ? "#00ffe7" : "#ffb300");
    textSize(28);
    textAlign(CENTER, CENTER);
    text(this.word, this.x, this.y);
  }
  isOffScreen() {
    return this.y > 510;
  }
}

// 遊戲狀態變數
let fallingWords = [];
let score = 0;
let lastDesc = '';
let lastResult = '';
let gameTime = 0;
let gameDuration = 60; // 遊戲秒數
let gameOver = false;
let lastWordTime = 0;
let gameState = 'intro'; // 'intro', 'playing', 'gameover'

function preload() {
  // Initialize HandPose model with flipped video input
  handPose = ml5.handPose({ flipped: true });
}

function mousePressed() {
  console.log(hands);
}

function gotHands(results) {
  hands = results;
}

function setup() {
  cnv = createCanvas(640, 480);
  cnv.parent(document.body);
  centerCanvas();
  video = createCapture(VIDEO, { flipped: true });
  video.size(640, 480);
  video.hide();
  handPose.detectStart(video, gotHands);
  textFont('Noto Sans TC');
  frameRate(30);
  gameTime = millis();
}

function centerCanvas() {
  let x = (windowWidth - width) / 2;
  let y = (windowHeight - height) / 2;
  cnv.position(x, y);
}

function windowResized() {
  centerCanvas();
}

// 計算視訊顯示區域（保持比例，置中）
function getVideoDisplayRect() {
  let videoAspect = video.width / video.height;
  let canvasAspect = width / height;
  let drawW, drawH, drawX, drawY;
  if (canvasAspect > videoAspect) {
    // 畫布較寬，以高度為基準
    drawH = height;
    drawW = height * videoAspect;
    drawX = (width - drawW) / 2;
    drawY = 0;
  } else {
    // 畫布較高，以寬度為基準
    drawW = width;
    drawH = width / videoAspect;
    drawX = 0;
    drawY = (height - drawH) / 2;
  }
  return {x: drawX, y: drawY, w: drawW, h: drawH};
}

function draw() {
  let vrect = getVideoDisplayRect();
  setGradient(0, 0, width, height, color(0,30,60), color(0,180,255), 1);
  image(video, vrect.x, vrect.y, vrect.w, vrect.h);

  // 遊戲解說 intro 畫面
  if (gameState === 'intro') {
    fill(0,180,255, 220);
    rect(0, height/2-180, width, 340);
    textAlign(CENTER, CENTER);
    fill(255);
    textSize(38);
    text('抓對抓錯：你了解教育科技嗎？', width/2, height/2-110);
    textSize(22);
    text('遊戲玩法：', width/2, height/2-60);
    textSize(18);
    text('畫面上方會掉落詞語，分為「與教育科技系相關」與「不相關」兩種。', width/2, height/2-30);
    text('請用雙手食指連成的弧線去「接住正確的詞語」，閃避錯誤的詞語。', width/2, height/2);
    text('抓對加1分，抓錯扣1分，並顯示說明補充。', width/2, height/2+30);
    text('遊戲限時60秒，結束後可再玩一次。', width/2, height/2+60);
    textSize(18);
    fill(255,255,0);
    text('操作：請對著鏡頭，雙手食指指尖連成弧線去接詞語', width/2, height/2+100);
    fill(255);
    text('按空白鍵開始遊戲', width/2, height/2+140);
    noLoop();
    return;
  }

  // 遊戲結束
  if (gameOver || gameState === 'gameover') {
    fill(0,180,255, 220);
    rect(0, height/2-100, width, 200);
    textAlign(CENTER, CENTER);
    fill(255);
    textSize(40);
    text('遊戲結束', width/2, height/2-30);
    textSize(28);
    text('你的得分：' + score, width/2, height/2+20);
    textSize(20);
    text('教育科技讓學習更有趣、更有效！', width/2, height/2+60);
    textSize(18);
    text('按空白鍵再玩一次', width/2, height/2+100);
    noLoop();
    return;
  }

  // 掉落詞語生成（每0.9秒一個，避免重疊，最多同時8個）
  if (gameState === 'playing' && fallingWords.length < 8 && millis() - lastWordTime > 900) {
    let idx = floor(random(eduTechWords.length));
    let tries = 0;
    let newWord;
    let overlap;
    do {
      newWord = new FallingWord(eduTechWords[idx]);
      overlap = false;
      for (let fw of fallingWords) {
        if (!fw.caught && abs(fw.x - newWord.x) < 100 && abs(fw.y - newWord.y) < 40) {
          overlap = true;
          break;
        }
      }
      tries++;
    } while (overlap && tries < 10);
    fallingWords.push(newWord);
    lastWordTime = millis();
  }

  // 更新與繪製掉落詞語
  if (gameState === 'playing') {
    for (let fw of fallingWords) {
      if (!fw.caught) {
        fw.update();
        fw.display();
      }
    }
  }

  // MediaPipe骨架繪製
  const HAND_CONNECTIONS = [
    [0,1],[1,2],[2,3],[3,4],
    [0,5],[5,6],[6,7],[7,8],
    [5,9],[9,10],[10,11],[11,12],
    [9,13],[13,14],[14,15],[15,16],
    [13,17],[17,18],[18,19],[19,20],
    [0,17]
  ];
  let leftIndexTip = null;
  let rightIndexTip = null;
  if (hands.length > 0) {
    for (let hand of hands) {
      if (hand.confidence > 0.1) {
        stroke(0, 255, 128);
        strokeWeight(3);
        for (let conn of HAND_CONNECTIONS) {
          let kpA = hand.keypoints[conn[0]];
          let kpB = hand.keypoints[conn[1]];
          let ax = kpA.x;
          let ay = kpA.y;
          let bx = kpB.x;
          let by = kpB.y;
          line(ax, ay, bx, by);
        }
        noStroke();
        for (let i = 0; i < hand.keypoints.length; i++) {
          let keypoint = hand.keypoints[i];
          let kx = keypoint.x;
          let ky = keypoint.y;
          if (hand.handedness == "Left") {
            fill(255, 0, 255);
          } else {
            fill(255, 255, 0);
          }
          circle(kx, ky, 16);
        }
        if (hand.handedness == "Left") {
          leftIndexTip = hand.keypoints[8];
        } else if (hand.handedness == "Right") {
          rightIndexTip = hand.keypoints[8];
        }
      }
    }
  }

  // 只有同時偵測到左右手時才進行弧線繪製與碰撞判斷
  if (gameState === 'playing' && leftIndexTip && rightIndexTip) {
    stroke(0, 200, 255);
    strokeWeight(6);
    noFill();
    let midX = (leftIndexTip.x + rightIndexTip.x) / 2;
    let midY = (leftIndexTip.y + rightIndexTip.y) / 2 + 80;
    bezier(
      leftIndexTip.x, leftIndexTip.y,
      leftIndexTip.x, midY,
      rightIndexTip.x, midY,
      rightIndexTip.x, rightIndexTip.y
    );

    // 掉落詞語碰撞判斷
    for (let fw of fallingWords) {
      if (fw.caught) continue;
      let minDist = 9999;
      for (let t = 0; t <= 1; t += 0.05) {
        let bx = bezierPoint(leftIndexTip.x, leftIndexTip.x, rightIndexTip.x, rightIndexTip.x, t);
        let by = bezierPoint(leftIndexTip.y, midY, midY, rightIndexTip.y, t);
        let d = dist(fw.x, fw.y, bx, by);
        if (d < minDist) minDist = d;
      }
      if (minDist < 32) {
        fw.caught = true;
        if (fw.correct) {
          score++;
          lastResult = '抓對了！';
        } else {
          score--;
          lastResult = '再想一下喔～';
        }
        lastDesc = fw.desc;
      }
    }
  }

  // 移除已抓到或掉出畫面的詞語
  if (gameState === 'playing') {
    fallingWords = fallingWords.filter(fw => !fw.isOffScreen() && !fw.caught);
  }

  // 分數與說明顯示
  if (gameState === 'playing') {
    fill(0,180,255, 180);
    rect(0,0,width,60);
    fill(255);
    textSize(24);
    textAlign(LEFT, CENTER);
    text('分數：' + score, 20, 30);
    textAlign(RIGHT, CENTER);
    text('剩餘時間：' + max(0, gameDuration - floor((millis()-gameTime)/1000)) + ' 秒', width-20, 30);
    if (lastDesc) {
      fill(0,180,255, 200);
      rect(0, height-60, width, 60);
      fill(255);
      textSize(20);
      textAlign(CENTER, CENTER);
      text(lastResult + ' ' + lastDesc, width/2, height-30);
    }
  }

  // 倒數計時與結束
  if (gameState === 'playing' && (millis()-gameTime)/1000 > gameDuration) {
    gameState = 'gameover';
  }
}

// 動態漸層背景函式
function setGradient(x, y, w, h, c1, c2, axis) {
  noFill();
  for (let i = y; i <= y + h; i++) {
    let inter = map(i, y, y + h, 0, 1);
    let c = lerpColor(c1, c2, inter);
    stroke(c);
    line(x, i, x + w, i);
  }
}

function keyPressed() {
  if (gameState === 'intro' && (key === ' ' || keyCode === 32)) {
    // 開始遊戲
    fallingWords = [];
    score = 0;
    lastDesc = '';
    lastResult = '';
    gameTime = millis();
    gameOver = false;
    lastWordTime = 0;
    gameState = 'playing';
    loop();
  } else if (gameState === 'gameover' && (key === ' ' || keyCode === 32)) {
    // 重設遊戲狀態
    fallingWords = [];
    score = 0;
    lastDesc = '';
    lastResult = '';
    gameTime = millis();
    gameOver = false;
    lastWordTime = 0;
    gameState = 'playing';
    loop();
  }
}
