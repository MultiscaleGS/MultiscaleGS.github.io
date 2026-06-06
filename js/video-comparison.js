const video1 = document.getElementById("vid1"); // 左侧 3DGS
const video2 = document.getElementById("vid2"); // 中间 Pixel-GS
const video3 = document.getElementById("vid3"); // 右侧 MSGS

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let position1 = 0.33;
let position2 = 0.66;
let draggingLine = null;
let initialized = false;

// 等待三个视频加载完成
video1.addEventListener("loadeddata", init);
video2.addEventListener("loadeddata", init);
video3.addEventListener("loadeddata", init);

function init() {
  if (initialized) return;
  if (video1.readyState >= 2 && video2.readyState >= 2 && video3.readyState >= 2) {
    initialized = true;

    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    video1.currentTime = 0;
    video2.currentTime = 0;
    video3.currentTime = 0;

    video1.play();
    video2.play();
    video3.play();

    requestAnimationFrame(draw);
  }
}

// 拖动交互
canvas.addEventListener("mousedown", (e) => {
  const x = getCanvasX(e);
  const splitX1 = canvas.width * position1;
  const splitX2 = canvas.width * position2;
  draggingLine = Math.abs(x - splitX1) < Math.abs(x - splitX2) ? 1 : 2;
  updateMousePos(e);
});

window.addEventListener("mouseup", () => { draggingLine = null; });

canvas.addEventListener("mousemove", (e) => { if (draggingLine !== null) updateMousePos(e); });

canvas.addEventListener("touchstart", (e) => {
  const x = getTouchCanvasX(e);
  const splitX1 = canvas.width * position1;
  const splitX2 = canvas.width * position2;
  draggingLine = Math.abs(x - splitX1) < Math.abs(x - splitX2) ? 1 : 2;
  updateTouchPos(e);
});

canvas.addEventListener("touchmove", (e) => { if (draggingLine !== null) updateTouchPos(e); });
canvas.addEventListener("touchend", () => { draggingLine = null; });

function getCanvasX(e) {
  const rect = canvas.getBoundingClientRect();
  return (e.clientX - rect.left) / rect.width * canvas.width;
}

function getTouchCanvasX(e) {
  const rect = canvas.getBoundingClientRect();
  return (e.touches[0].clientX - rect.left) / rect.width * canvas.width;
}

function updateMousePos(e) { updatePosition(getCanvasX(e)); }
function updateTouchPos(e) { updatePosition(getTouchCanvasX(e)); }

function updatePosition(x) {
  const p = Math.min(Math.max(x / canvas.width, 0), 1);
  if (draggingLine === 1) position1 = Math.max(0, Math.min(p, position2));
  if (draggingLine === 2) position2 = Math.min(1, Math.max(p, position1));
}

// 绘制圆角矩形（标签背景）
function drawRoundedRect(x, y, w, h, r, color) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

// 绘制竖线和箭头
function drawLineAndArrow(x) {
  ctx.beginPath();
  ctx.moveTo(x, 0);
  ctx.lineTo(x, canvas.height);
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 4;
  ctx.stroke();

  const centerY = canvas.height / 2;
  const arrowSize = canvas.height * 0.012;
  const gap = canvas.height * 0.018;

  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 5;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.beginPath();
  ctx.moveTo(x - gap, centerY - arrowSize);
  ctx.lineTo(x - gap - arrowSize, centerY);
  ctx.lineTo(x - gap, centerY + arrowSize);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x + gap, centerY - arrowSize);
  ctx.lineTo(x + gap + arrowSize, centerY);
  ctx.lineTo(x + gap, centerY + arrowSize);
  ctx.stroke();
}

// 绘制视频区域标签
function drawLabel(text, startX, endX) {
  const labelPaddingX = 12;
  const labelHeight = 30;
  const labelY = canvas.height - labelHeight - 10;
  const labelRadius = 8;

  ctx.font = "24px Arial";
  ctx.textBaseline = "middle";

  const textWidth = ctx.measureText(text).width;
  const labelWidth = textWidth + labelPaddingX * 2;

  let labelX = startX + (endX - startX) / 2 - labelWidth / 2;
  labelX = Math.max(startX, Math.min(labelX, endX - labelWidth));

  if (endX - startX > labelWidth + 6) {
    drawRoundedRect(labelX, labelY, labelWidth, labelHeight, labelRadius, "rgba(255,255,255,0.7)");
    ctx.fillStyle = "#000000";
    ctx.fillText(text, labelX + labelPaddingX, labelY + labelHeight / 2);
  }
}

// 主循环绘制
function draw() {
  const t = video1.currentTime;

  if (Math.abs(video2.currentTime - t) > 0.08) {
    video2.currentTime = t;
  }

  if (Math.abs(video3.currentTime - t) > 0.08) {
    video3.currentTime = t;
  }
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const splitX1 = canvas.width * position1;
  const splitX2 = canvas.width * position2;

  // 1. 左侧：完整绘制 3DGS
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, splitX1, canvas.height);
  ctx.clip();
  ctx.drawImage(video1, 0, 0, canvas.width, canvas.height);
  ctx.restore();

  // 2. 中间：完整绘制 Pixel-GS，但只显示中间区域
  ctx.save();
  ctx.beginPath();
  ctx.rect(splitX1, 0, splitX2 - splitX1, canvas.height);
  ctx.clip();
  ctx.drawImage(video2, 0, 0, canvas.width, canvas.height);
  ctx.restore();

  // 3. 右侧：完整绘制 MSGS，但只显示右侧区域
  ctx.save();
  ctx.beginPath();
  ctx.rect(splitX2, 0, canvas.width - splitX2, canvas.height);
  ctx.clip();
  ctx.drawImage(video3, 0, 0, canvas.width, canvas.height);
  ctx.restore();

  drawLineAndArrow(splitX1);
  drawLineAndArrow(splitX2);

  drawLabel("3DGS", 0, splitX1);
  drawLabel("MGS", splitX1, splitX2);
  drawLabel("Identification", splitX2, canvas.width);

  requestAnimationFrame(draw);
}