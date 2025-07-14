
const firebaseConfig = {
  apiKey: "AIzaSyBLWYpv72R8z4XwZE6F2y9mdy4HDdiqkHc",
  authDomain: "city-scavenger-hunt-2025.firebaseapp.com",
  databaseURL: "https://city-scavenger-hunt-2025-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "city-scavenger-hunt-2025",
  storageBucket: "city-scavenger-hunt-2025.firebasestorage.app",
  messagingSenderId: "950959276332",
  appId: "1:950959276332:web:cbbd2bd8dc49619aa42c89",
  measurementId: "G-5GE9NWQ1YP"
};

let db;
let teams = [];
let teamIndex = null;
let team = null;
let progressRef = null;

const pagePasswords = {
  '1-3-b': 'RUBIES',
  '1-4-b': '256',
  '1-5-b': '牽知己',
  '2-3-a': '別用分數定義我',
  '2-5-a': '真實的自己藏在標準答案外',
  '3-3': '失衡的他倒臥在⾃⼰設計的庇護之中',
  '3-4': 'CF泰B越A菲ED',
  '3-5': '工17GIMETRALA',
  '3-6': '850000',
  '3-7': '明公軍AW大城老大老老老老秋整霜',
  '3-8': '慕勝天坦都里烤雞烤餅圓周率東南',
};

function showAlert(msg) {
  const modal = document.getElementById('alert-modal');
  const textEl = document.getElementById('alert-text');
  if (!modal || !textEl) return;
  textEl.textContent = msg;
  modal.classList.add('show');
}

function hideAlert() {
  const modal = document.getElementById('alert-modal');
  if (!modal) return;
  modal.classList.remove('show');
}

async function initFirebase() {
  const app = firebase.initializeApp(firebaseConfig);
  db = firebase.database(app);
  const snapshot = await db.ref('cityScavengerHunt').get();
  teams = snapshot.val() || [];
}

async function updateCurrent(value) {
  if (teamIndex === null) return;
  const updates = { current: value };
  await db.ref(`cityScavengerHunt/${teamIndex}`).update(updates);
  team.current = value;
}

function watchProgress() {
  if (progressRef) progressRef.off();
  if (teamIndex === null) return;
  progressRef = db.ref(`cityScavengerHunt/${teamIndex}`);
  progressRef.on('value', snap => {
    const data = snap.val();
    if (!data) return;
    if (team && data.current != null && data.current !== team.current) {
      const idx = Number(data.current);
      team.current = idx;
      const stepId = team.sequence[idx] || team.sequence[0];
      loadPage(stepId);
    }
  });
}

async function loadPage(id) {
  const res = await fetch(`${id}.html`);
  const text = await res.text();
  const doc = new DOMParser().parseFromString(text, 'text/html');
  const styleEl = document.getElementById('page-style');
  styleEl.textContent = doc.querySelector('style')?.textContent || '';
  const container = document.getElementById('page-container');
  container.innerHTML = doc.body.innerHTML;
  attachHandler(id);
}

function attachHandler(id) {
  if (id === '0-2') {
    setupStartPage();
    // 當 current 為 17 時，自動顯示冰淇淋兌換券彈窗
    if (team && Number(team.current) === 17) {
      showAlert('獲得一張：冰淇淋兌換券');
      const close = document.getElementById('alert-close');
      const handler = () => {
        close.removeEventListener('click', handler);
        hideAlert();
        // 觸發彈窗
        const rewardBtn = document.querySelector('.circle-btn.reward');
        if (rewardBtn) rewardBtn.click();
      };
      close.addEventListener('click', handler);
    }
    // -- 新增：當 current > 16 時，點擊「獎勵」按鈕顯示冰淇淋兌換券 --
    const rewardBtn = document.querySelector('.circle-btn.reward');
    const couponEl  = document.getElementById('coupon');

    if (rewardBtn && couponEl) {
      // 點擊「獎勵」時檢查 current，>16 才能領取
      rewardBtn.addEventListener('click', () => {
        if (team && Number(team.current) > 16) {
          couponEl.style.display = 'block';
          couponEl.classList.remove('hideAnim');
          couponEl.classList.add('show');
        } else {
          showAlert('完成更多任務才能領獎喔！');
        }
      });

      // 綁定關閉按鈕
      const closeCouponBtn = document.getElementById('closeCoupon');
      if (closeCouponBtn) {
        closeCouponBtn.addEventListener('click', () => {
          couponEl.classList.remove('show');
          couponEl.classList.add('hideAnim');
        });
      }

      // 動畫結束後隱藏 coupon
      couponEl.addEventListener('animationend', (e) => {
        if (e.animationName === 'fadeOut') {
          couponEl.style.display = 'none';
        }
      });
    }
    // -- 新增程式碼結束 --
    return;
  }
  if (id === '2-2') {
    setupInvolutionPage();
    return;
  }
  if (id === '1-2') {
    setupThreadPage();
    return;
  }
  // Special handler for 2-4.html
  if (id === '2-4') {
    const confirmBtn = document.querySelector('#page-container .confirm-btn');
    const input = document.querySelector('#page-container .input-area input');
    const correctPassword = '4r5b7a1828kqz23w';
    if (confirmBtn && input) {
      confirmBtn.addEventListener('click', async () => {
        const pwd = input.value.trim();
        if (pwd !== correctPassword) {
          showAlert('真正的密碼只有卷解知道，請依照指示對卷解喊出通關密語');
          return;
        }
        showAlert('密碼正確');
        const close = document.getElementById('alert-close');
        const handler = async () => {
          close.removeEventListener('click', handler);
          hideAlert();
          // 密碼正確後更新進度並跳轉
          const currIdx = team.current != null
            ? Number(team.current)
            : team.sequence.indexOf(id);
          const nextIndex = currIdx + 1;
          await updateCurrent(nextIndex);
          await loadPage(team.sequence[nextIndex]);
        };
        close.addEventListener('click', handler);
      });
    }
    return;
  }
  if (id === '2-4') {
    const confirmBtn = document.querySelector('#page-container .confirm-btn');
    const input = document.querySelector('#page-container .input-area input');
    const warningModal = document.getElementById('warningModal');
    const closeBtn = document.querySelector('.close-button');
    const correctPassword = '4r5b7a1828kqz23w';

    if (confirmBtn && input && warningModal && closeBtn) {
      confirmBtn.addEventListener('click', async () => {
        const pwd = input.value.trim();
        if (pwd !== correctPassword) {
          warningModal.style.display = 'flex';
          return;
        }
        // 密碼正確，更新進度並跳轉
        const currIdx = team.current != null
          ? Number(team.current)
          : team.sequence.indexOf(id);
        const nextIndex = currIdx + 1;
        await updateCurrent(nextIndex);
        await loadPage(team.sequence[nextIndex]);
      });
      closeBtn.addEventListener('click', () => {
        warningModal.style.display = 'none';
      });
    }
    return;
  }
  // Special handler for 3-2.html: only allow one grid-btn based on the next step
  if (id === '3-2') {
    setupDistancePage();
    return;
  }
  const btn = document.querySelector('#page-container button.confirm-btn') ||
              document.querySelector('#page-container button[type="submit"]');
  if (!btn) return;
  btn.addEventListener('click', async () => {
    let nextId;
    let nextIndex;
    if (id === '0-1') {
      const pwd = document.querySelector('#page-container input')?.value.trim();
      const idx = teams.findIndex(t => t.password === pwd);
      if (idx === -1) {
        showAlert('密碼錯誤');
        return;
      }
      teamIndex = idx;
      team = teams[idx];
      watchProgress();
      const i0 = team.sequence.indexOf('0-1');
      const currIdx = team.current != null ? Number(team.current) : i0;
      if (currIdx !== i0) {
        nextIndex = currIdx;
        nextId = team.sequence[currIdx];
      } else {
        nextId = team.sequence[i0 + 1];
        nextIndex = i0 + 1;
      }
    } else {
      const input = document.querySelector('#page-container input');
      if (input) {
        const pwd = input.value.trim();
        const correct = pagePasswords[id] || 'password';
        if (pwd !== correct) {
          showAlert('密碼錯誤');
          return;
        } else {
          showAlert('密碼正確');
          const close = document.getElementById('alert-close');
          const handler = async () => {
            close.removeEventListener('click', handler);
            hideAlert();
            // 密碼正確後更新進度並加載下一頁
            const currIdx = team.current != null
              ? Number(team.current)
              : team.sequence.indexOf(id);
            const nextId = team.sequence[currIdx + 1];
            const nextIndex = currIdx + 1;
            await updateCurrent(nextIndex);
            await loadPage(nextId);
          };
          close.addEventListener('click', handler);
          return;
        }
      }
      const currIdx = team.current != null ? Number(team.current) : team.sequence.indexOf(id);
      nextId = team.sequence[currIdx + 1];
      nextIndex = currIdx + 1;
    }
    if (nextId) {
      await updateCurrent(nextIndex);
      const finales = {
        // 終點關卡完成提示
        '1-6': '恭喜完成「苦盡甘來遇線你」\n隱藏任務已解鎖 可打開編號為delta的信封袋',
        '2-6': '恭喜完成「內卷即地獄」\n隱藏任務已解鎖 可打開編號為theta的信封袋',
        '3-6': '恭喜完成「我們與醫的距離」隱藏任務已解鎖\n請和副社長領取任務 口令「緩解容貌焦慮」'
      };
      if (finales[id]) {
        showAlert(`${finales[id]}`);
        const close = document.getElementById('alert-close');
        const handler = async () => {
          close.removeEventListener('click', handler);
          hideAlert();
          await loadPage(nextId);
        };
        close.addEventListener('click', handler);
      } else {
        await loadPage(nextId);
      }
    }
  });
}

function setupStartPage() {
  if (!team) return;
  // 同時抓取 <button> 與其他自訂 .square‑btn 元素（可能是 <a> 或 <div>）
  const buttons = document.querySelectorAll('#page-container .button-group button, #page-container .button-group .square-btn');
  if (buttons.length < 3) return;

  const currIdx = team.current != null ? Number(team.current) : team.sequence.indexOf('0-2');
  const nextId = team.sequence[currIdx + 1];
  if ([3, 7, 12].includes(currIdx)) {
    const classMap = {
      '1-3-a': 'btn-red',
      '1-4-a': 'btn-gold',
      '1-5-a': 'btn-blue'
    };
    const allowClass = classMap[nextId];
    // 先將全部按鈕反白鎖定
    buttons.forEach(btn => {
      btn.classList.add('disabled');
      btn.disabled = true;
    });
    if (allowClass) {
      buttons.forEach(btn => {
        if (btn.classList.contains(allowClass)) {
          btn.classList.remove('disabled');
          btn.disabled = false;
          btn.addEventListener('click', async () => {
            const nextIndex = currIdx + 1;
            await updateCurrent(nextIndex);
            await loadPage(nextId);
          });
        }
      });
    }
    return; // 已處理特殊情況，後續邏輯不再執行
  }
  const visited = team.sequence.slice(0, currIdx);
  const done1 = visited.includes('1-2');
  const done2 = visited.includes('2-5-b');
  const done3 = visited.includes('3-9');

  buttons.forEach(btn => {
    btn.classList.add('disabled');
    btn.disabled = true;
  });

  if (done1) buttons[0].classList.add('done');
  if (done2) buttons[1].classList.add('done');
  if (done3) buttons[2].classList.add('done');

  let idx;
  if (nextId.startsWith('1')) idx = 0;
  else if (nextId.startsWith('2')) idx = 1;
  else if (nextId.startsWith('3')) idx = 2;

  const target = buttons[idx];
  target.classList.remove('disabled');
  target.disabled = false;
  target.addEventListener('click', async () => {
    const nextIndex = currIdx + 1;
    await updateCurrent(nextIndex);
    await loadPage(nextId);
  });
}

window.addEventListener('DOMContentLoaded', async () => {
  const style = document.createElement('style');
  style.textContent = `
    /* 一般按鈕被禁用時背景 */
    .button-group button.disabled {
      background-color: #e6e3d3 !important;
      color: #000 !important;
      opacity: 1 !important;
      pointer-events: none !important;
    }
    /* 自訂方形按鈕被禁用時背景 */
    .square-btn.disabled {
      background-color: #e6e3d3 !important;
      color: #000 !important;
      opacity: 1 !important;
      pointer-events: none !important;
    }
    /* 圖片灰階效果適用於所有禁用按鈕 */
    .button-group button.disabled img,
    .square-btn.disabled img {
      opacity: 0.6 !important;
    }
    /* 2‑2 頁面的 .grid-btn 被禁用時的外觀 */
    .grid-btn.disabled {
      background-color: #e6e3d3 !important;
      color: #000 !important;
      opacity: 1 !important;
      pointer-events: none !important;
    }
    .grid-btn.disabled img {
      opacity: 0.6 !important;
    }
  `;
  document.head.appendChild(style);

  const closeBtn = document.getElementById('alert-close');
  if (closeBtn) closeBtn.addEventListener('click', hideAlert);
  await initFirebase();
  loadPage('0-1');
});

/**
 * 根據 current 在 3 / 7 / 12（對應第一次、第二次、第三次進入 1‑2.html）時，
 * 只開放正確顏色的線可點，其餘反白且禁止操作。
 */
function setupThreadPage() {
  if (!team) return;

  // 1-2.html 內的三條線按鈕
  const buttons = document.querySelectorAll('#page-container .square-btn');
  if (buttons.length === 0) return;

  const currIdx = team.current != null ? Number(team.current) : team.sequence.indexOf('1-2');
  const nextId  = team.sequence[currIdx + 1];   // 會是 1‑3‑a / 1‑4‑a / 1‑5‑a

  const classMap = {
    '1-3-a': 'btn-red',
    '1-4-a': 'btn-gold',
    '1-5-a': 'btn-blue'
  };
  const allowClass = classMap[nextId];

  // 先把全部線按鈕反白並鎖定
  buttons.forEach(btn => {
    btn.classList.add('disabled');
    btn.disabled = true;
  });

  // 只啟用符合顏色的那一條線
  if (allowClass) {
    buttons.forEach(btn => {
      if (btn.classList.contains(allowClass)) {
        btn.classList.remove('disabled');
        btn.disabled = false;
        btn.addEventListener('click', async () => {
          const nextIndex = currIdx + 1;
          await updateCurrent(nextIndex);
          await loadPage(nextId);
        });
      }
    });
  }
}

/**
 * 依照關卡進度控制 2‑2.html 內三條線按鈕的啟用狀態。
 * 當 nextId 為：
 *    ‑ 2‑3‑a  → 只開放第 1 顆「卷哥線」按鈕
 *    ‑ 2‑4    → 只開放第 2 顆「卷解線」按鈕
 *    ‑ 2‑5‑a  → 只開放第 3 顆「學習歷程線」按鈕
 * 其他按鈕一律反白並鎖定。
 */
function setupInvolutionPage() {
  if (!team) return;

  // 2‑2.html 內的三條 .grid‑btn
  const buttons = document.querySelectorAll('#page-container .grid-btn');
  if (buttons.length === 0) return;

  // 取得當前索引與下一個關卡 id
  const currIdx = team.current != null ? Number(team.current) : team.sequence.indexOf('2-2');
  const nextId  = team.sequence[currIdx + 1];

  // 對應關卡 → 按鈕索引
  const map = {
    '2-3-a': 0,  // 卷哥線
    '2-4':   1,  // 卷解線
    '2-5-a': 2   // 學習歷程線
  };
  const allowIdx = map[nextId];

  // 先將全部鈕反白鎖定
  buttons.forEach(btn => {
    btn.classList.add('disabled');
    btn.disabled = true;
  });

  // 只啟用符合條件的那一顆
  if (allowIdx != null) {
    const btn = buttons[allowIdx];
    btn.classList.remove('disabled');
    btn.disabled = false;
    btn.addEventListener('click', async () => {
      const nextIndex = currIdx + 1;
      await updateCurrent(nextIndex);
      await loadPage(nextId);
    });
  }
}

/**
 * 根據 current 在 3-2 時，控制 3-2.html 內六個 grid-btn 的啟用狀態。
 * 當 nextId 為：
 *   - '3-3' → 只開放第 1 個「平衡」按鈕
 *   - '3-4' → 只開放第 2 個「責任」按鈕
 *   - '3-5' → 只開放第 3 個「從眾」按鈕
 *   - '3-6' → 只開放第 4 個「道德」按鈕
 *   - '3-7' → 只開放第 5 個「放棄」按鈕
 *   - '3-8' → 只開放第 6 個「完美」按鈕
 */
function setupDistancePage() {
  if (!team) return;
  const buttons = document.querySelectorAll('#page-container .grid-btn');
  if (buttons.length === 0) return;
  const currIdx = team.current != null ? Number(team.current) : team.sequence.indexOf('3-2');
  const nextId  = team.sequence[currIdx + 1];
  const map = {
    '3-3': 0,
    '3-4': 1,
    '3-5': 2,
    '3-6': 3,
    '3-7': 4,
    '3-8': 5
  };
  const allowIdx = map[nextId];
  buttons.forEach(btn => {
    btn.classList.add('disabled');
    btn.disabled = true;
  });
  if (allowIdx != null) {
    const btn = buttons[allowIdx];
    btn.classList.remove('disabled');
    btn.disabled = false;
    btn.addEventListener('click', async () => {
      const nextIndex = currIdx + 1;
      await updateCurrent(nextIndex);
      await loadPage(nextId);
    });
  }
}
