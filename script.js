'use strict';

const employeeData = {
  "1111111": "たまろう",
  "1111112": "せいじろう",
  "1111113": "むーさん",
  "1111114": "Reito"
};

let selectedRoomId = '';
let selectedRoomName = '';
let historyRecords = [];
let roomStatus = {};

if (localStorage.getItem('historyRecords')) {
  historyRecords = JSON.parse(localStorage.getItem('historyRecords'));
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  historyRecords = historyRecords.filter(r => {
    const date = new Date(`2025/${r.time}`);
    return date >= oneMonthAgo;
  });
}
if (localStorage.getItem('roomStatus')) {
  roomStatus = JSON.parse(localStorage.getItem('roomStatus'));
}

window.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.status.returned').forEach(badge => {
    badge.textContent = '✅';
  });
});

document.addEventListener('DOMContentLoaded', () => {
  const popup = document.getElementById('popup');
  const overlay = document.getElementById('overlay');
  const popupContent = document.getElementById('popup-content');
  const closeIcon = document.getElementById('closeIcon');

  historyRecords.forEach(record => {
    const row = document.getElementById(record.room)?.parentElement;
    const shortId = record.room.replace('room-', '');
    const nameCell = document.getElementById('name-' + shortId);

    if (record.action === '貸出') {
      if (nameCell) nameCell.textContent = record.name;
      if (row) {
        row.cells[2].textContent = record.time;
        row.cells[3].textContent = '';
        row.cells[4].textContent = '';
      }
    } else if (record.action === '返却') {
      if (row) {
        row.cells[3].textContent = record.time;
        row.cells[4].textContent = record.name;
      }
    }
  });

  updateStatusBadges();

  document.querySelectorAll('.clickable').forEach(cell => {
    cell.addEventListener('click', () => {
      selectedRoomId = cell.id;
      selectedRoomName = cell.querySelector('.room-name')?.textContent || cell.textContent.trim();
      showActionForm();
      popup.style.display = 'block';
      overlay.style.display = 'block';
    });
  });

  closeIcon.addEventListener('click', closePopup);
  overlay.addEventListener('click', closePopup);

  function getFormattedDateTime() {
    const now = new Date();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const mi = String(now.getMinutes()).padStart(2, '0');
    return `${mm}/${dd} ${hh}:${mi}`;
  }

  function showActionForm() {
    popupContent.innerHTML = `
      <h2>🔑 ${selectedRoomName} の操作</h2>
      <input type="text" id="employeeNumber" placeholder="従業員番号を入力" /><br><br>
      <div class="popup-buttons">
        <button id="lendBtn">貸出</button>
        <button id="returnBtn">返却</button>
        <button id="historyBtn">履歴を見る</button>
      </div>
    `;

    document.getElementById('lendBtn').addEventListener('click', handleLend);
    document.getElementById('returnBtn').addEventListener('click', handleReturn);
    document.getElementById('historyBtn').addEventListener('click', showHistory);
  }

  function handleLend() {
    const empNum = document.getElementById('employeeNumber').value;
    const name = employeeData[empNum];
    if (!name) return alert('従業員番号が見つかりません');
    if (roomStatus[selectedRoomId] === '貸出中') return alert('この鍵はまだ返却されていません');

    showConfirmation(name, () => {
      const now = getFormattedDateTime();
      const row = document.getElementById(selectedRoomId).parentElement;
      const nameCell = document.getElementById('name-' + selectedRoomId.replace('room-', ''));

      if (nameCell) nameCell.textContent = name;
      if (row) {
        row.cells[2].textContent = now;
        row.cells[3].textContent = '';
        row.cells[4].textContent = '';
      }

      historyRecords.push({ room: selectedRoomId, action: '貸出', name, time: now });
      roomStatus[selectedRoomId] = '貸出中';
      saveToLocalStorage();
      updateStatusBadges();
      closePopup();
    });
  }

  function handleReturn() {
    const empNum = document.getElementById('employeeNumber').value;
    const name = employeeData[empNum];
    if (!name) return alert('従業員番号が見つかりません');
    if (roomStatus[selectedRoomId] !== '貸出中') return alert('まだ貸出されていません');

    showConfirmation(name, () => {
      const now = getFormattedDateTime();
      const row = document.getElementById(selectedRoomId).parentElement;

      if (row) {
        row.cells[3].textContent = now;
        row.cells[4].textContent = name;
      }

      historyRecords.push({ room: selectedRoomId, action: '返却', name, time: now });
      roomStatus[selectedRoomId] = '返却済み';
      saveToLocalStorage();
      updateStatusBadges();
      closePopup();
    });
  }

  function showHistory() {
    const filtered = historyRecords.filter(r => r.room === selectedRoomId).reverse();
    popup.style.width = '90vw';

    let html = `<h2>📄 ${selectedRoomName} の履歴</h2><div style="display:flex;flex-wrap:wrap;gap:10px;">`;
    const chunkSize = 10;
    for (let i = 0; i < filtered.length; i += chunkSize) {
      html += `<table border="1" style="width:250px; font-size:16px;"><tr><th>操作</th><th>氏名</th><th>時間</th></tr>`;
      filtered.slice(i, i + chunkSize).forEach(r => {
        html += `<tr><td>${r.action}</td><td>${r.name}</td><td>${r.time}</td></tr>`;
      });
      html += `</table>`;
    }
    html += `</div><br><button id="backBtn">戻る</button>`;
    popupContent.innerHTML = html;

    document.getElementById('backBtn').addEventListener('click', () => {
      popup.style.width = '400px';
      showActionForm();
    });
  }

  function saveToLocalStorage() {
    localStorage.setItem('historyRecords', JSON.stringify(historyRecords));
    localStorage.setItem('roomStatus', JSON.stringify(roomStatus));
  }

  function updateStatusBadges() {
    Object.keys(roomStatus).forEach(roomId => {
      const status = roomStatus[roomId];
      const badgeId = 'status-' + roomId.replace('room-', '');
      const badge = document.getElementById(badgeId);
      if (badge) {
        badge.className = 'status ' + (status === '貸出中' ? 'lent' : 'returned');
        badge.textContent = status === '貸出中' ? '⛔' : '✅';
      }
    });
  }

  function showConfirmation(name, onConfirm) {
    popupContent.innerHTML = `
      <h2>✅ 確認</h2>
      <p>${name}さんであっていますか？</p>
      <div class="popup-buttons">
        <button id="confirmYes">はい</button>
        <button id="confirmNo">いいえ</button>
      </div>
    `;

    document.getElementById('confirmYes').addEventListener('click', onConfirm);
    document.getElementById('confirmNo').addEventListener('click', showActionForm); // ←修正ポイント
  }

  function closePopup() {
    popup.style.display = 'none';
    overlay.style.display = 'none';
    popup.style.width = '400px';
  }
});
