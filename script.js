const pupil = document.querySelector('.pupil');
const container = document.querySelector('.eye-container');
const blinkLayer = document.querySelector('.blink');

// ==========================================
// 核心狀態變數 (放在最上方全域區)
// ==========================================
let isBlinking = false;
let isTouching = false;

// Lerp 動畫用的座標變數 (預設 0,0 讓眼睛一開始直視前方)
let targetX = 0;
let targetY = 0;
let currentX = 0;
let currentY = 0;

// ========== 1. 眨眼邏輯 ========== //
function triggerBlink() {
  if (isBlinking) return; 
  isBlinking = true;
  blinkLayer.classList.add('is-blinking'); 
  setTimeout(() => {
    blinkLayer.classList.remove('is-blinking'); 
    setTimeout(() => { isBlinking = false; }, 150);
  }, 150); 
}

window.addEventListener('mousedown', (e) => {
  if (e.button === 0 || e.button === 2) triggerBlink();
});
window.addEventListener('contextmenu', (e) => e.preventDefault());


// ========== 2. RWD 動態半徑計算函數 ========== //
function getAdaptiveRadius() {
  const rect = container.getBoundingClientRect();
  // 以原本 1000px 寬度時移動 35px 為基準 (比例為 0.035)
  // 當眼睛縮小時，移動極限也會跟著等比例縮小，確保絕不穿幫
  return rect.width * 0.035; 
}

function updatePupilPosition(moveX, moveY) {
  const maxRadius = getAdaptiveRadius();
  const distance = Math.sqrt(moveX * moveX + moveY * moveY);

  if (distance > maxRadius) {
    const angle = Math.atan2(moveY, moveX);
    moveX = Math.cos(angle) * maxRadius;
    moveY = Math.sin(angle) * maxRadius;
  }
  pupil.style.transform = `translate3d(${moveX}px, ${moveY}px, 0)`;
}


// ========== 3. 手指與游標跟隨邏輯 ========== //
document.addEventListener('pointerdown', () => { isTouching = true; });
document.addEventListener('pointerup', () => { 
  isTouching = false; 
  // 手機上放開手指後，讓眼睛慢慢回彈至中央，以便把控制權交給陀螺儀
 if (window.innerWidth < 1024) {
    targetX = 0;
    targetY = 0;
  }
});

document.addEventListener('pointermove', (e) => {
  if (e.pointerType === 'touch' && !isTouching) return;

  const rect = container.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  // 根據螢幕尺寸調整跟隨幅度，除以 10 是滑順衰減係數
  const targetX = (e.clientX - centerX) / 10;
  const targetY = (e.clientY - centerY) / 10;

  updatePupilPosition(targetX, targetY);
});


// ========== 4. 行動裝置陀螺儀 (盯人邏輯) ========== //
window.addEventListener('deviceorientation', (e) => {
  // 【關鍵修正】：如果正在觸控，或者裝置「沒有」陀螺儀數據（例如一般電腦），就直接中斷不執行！
  if (isTouching || e.beta === null || e.gamma === null) return;

  // 取得真實數值
  let gamma = e.gamma;
  let beta = e.beta;
  
  beta = beta - 45; // 基準面角度校正

  const scale = getAdaptiveRadius() / 25; 
  const targetX = -gamma * scale;
  const targetY = beta * scale;

  // 根據你目前使用的是哪種動畫寫法，這裡可能是 updatePupilPosition 或直接賦值給 targetY
  // 如果你沒有使用上一篇的「進階 Lerp 動畫寫法」，就是保留這行：
  updatePupilPosition(targetX, targetY);

  

});



// ==========================================
// 6. 漢堡選單開關邏輯
// ==========================================
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.menu');

hamburger.addEventListener('click', () => {
  hamburger.classList.toggle('is-active');
  navMenu.classList.toggle('is-active');
});

// ==========================================
// 7. 幻燈片全螢幕滾動引擎 (一滾動 = 換一頁)
// ==========================================
const scrollContainer = document.querySelector('.scroll-container');
const screens = document.querySelectorAll('.screen');

let currentScreenIndex = 0; 
let isScrolling = false;    

window.addEventListener('wheel', (e) => {
  e.preventDefault(); 

  if (isScrolling) return;

  if (e.deltaY > 30 || e.deltaX > 30) {
    currentScreenIndex++; 
  } else if (e.deltaY < -30 || e.deltaX < -30) {
    currentScreenIndex--; 
  } else {
    return; 
  }

  if (currentScreenIndex < 0) currentScreenIndex = 0;
  if (currentScreenIndex >= screens.length) currentScreenIndex = screens.length - 1;

  goToScreen(currentScreenIndex);
}, { passive: false });

function goToScreen(index) {
  isScrolling = true;
  currentScreenIndex = index;

  scrollContainer.scrollTo({
    left: index * window.innerWidth,
    behavior: 'smooth'
  });

  setTimeout(() => {
    isScrolling = false;
  }, 800); 
}

// ==========================================
// 8. 導覽列點擊與畫面切換整合 (共用同一個 navLinks)
// ==========================================
// 這裡我們只宣告一次 navLinks，把所有點擊要做的事情寫在一起
const navLinks = document.querySelectorAll('.menu a');

navLinks.forEach((link, index) => {
  link.addEventListener('click', (e) => {
    e.preventDefault(); 
    
    // 1. 切換到對應的畫面
    goToScreen(index);

    // 2. 如果是在手機版，點擊後自動收起毛玻璃選單
    if(hamburger.classList.contains('is-active')){
      hamburger.classList.remove('is-active');
      navMenu.classList.remove('is-active');
    }
  });
});

// ==========================================
// 9. LOGO 視差滾動效果 (與 ABOUT ME 一起退場)
// ==========================================
const logo = document.querySelector('.logo');

// 監聽透明滾動帶的滾動事件
scrollContainer.addEventListener('scroll', () => {
  // 取得目前精準的橫向滾動像素
  const scrollX = scrollContainer.scrollLeft;
  // 取得螢幕「單頁」的真實寬度
  const vw = scrollContainer.clientWidth;

  // 判斷邏輯：如果滾動距離超過一頁 (也就是準備離開 ABOUT ME，前往下一頁時)
  if (scrollX > vw) {
    // 計算出多出來的滾動距離
    const moveX = scrollX - vw;
    // 將這個距離換算成 LOGO 往左推移的負值，讓它跟著畫面一起被推走
    logo.style.transform = `translateX(-${moveX}px)`;
  } else {
    // 如果是在 HOME (第 1 頁) 和 ABOUT ME (第 2 頁) 之間，LOGO 死死釘在原位
    logo.style.transform = `translateX(0px)`;
  }
});