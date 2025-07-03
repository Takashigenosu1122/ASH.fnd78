'use strict';
 
const employeeData = {
  "1111111": "たまろう",
  "1111112": "せいじろう",
  "1111113": "むーさん",
  "1111114"'use strict';
 
let employeeData = {};
 
if (localStorage.getItem('employeeData')) {
  employeeData = JSON.parse(localStorage.getItem('employeeData'));
} else {
  // 初期データ
  employeeData = {
    "1111111": "たまろう",
    "1111112": "せいじろう",
    "1111113": "むーさん",
    "1111114": "Reito"
  };
  localStorage.setItem('employeeData', JSON.stringify(employeeData));
}
 
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
  const popup = document.getElementById('popup');
  const overlay = document.getElementById('overlay');
  const popupContent = document.getElementById('popup-content');
  const closeIcon = document.getElementById('closeIcon');
 
  document.querySelectorAll('.status.returned').forEach(badge => {
    badge.textContent = '✅';
  });
 
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
      document.getElementById('employeeNumber').focus();
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
  const status = roomStatus[selectedRoomId];
 
 let buttonsHtml = `
  <button id="historyBtn" class="popup-button">📝履歴を見る</button>
`;
 
 
  popupContent.innerHTML = `
    <h2>🔑 ${selectedRoomName} の操作</h2>
    <input type="text" id="employeeNumber" placeholder="従業員番号を入力" /><br><br>
    <div id="employeeNameDisplay" style="margin-top: 5px; font-weight: bold;"></div>
    <div class="popup-buttons">
      ${buttonsHtml}
    </div>
  `;
 
  // 要素取得とフォーカス
  const empInput = document.getElementById('employeeNumber');
  const nameDisplay = document.getElementById('employeeNameDisplay');
 
  // 入力イベント（半角変換＋7桁制限＋名前表示）
empInput.addEventListener('input', () => {
  // 全角→半角変換
  empInput.value = empInput.value.replace(/[Ａ-Ｚａ-ｚ０-９]/g, s =>
    String.fromCharCode(s.charCodeAt(0) - 0xFEE0)
  );
 
  // 7桁制限
  if (empInput.value.length > 7) {
    empInput.value = empInput.value.slice(0, 7);
  }
 
  // 7桁入力されたら自動処理
  const name = employeeData[empInput.value]; // ← これを追加
if (empInput.value.length === 7 && name) {
    const now = getFormattedDateTime();
    const row = document.getElementById(selectedRoomId).parentElement;
    const shortId = selectedRoomId.replace('room-', '');
    const nameCell = document.getElementById('name-' + shortId);
 
    if (roomStatus[selectedRoomId] === '貸出中') {
      // 返却処理
      if (row) {
        row.cells[3].textContent = now;
        row.cells[4].textContent = name;
      }
      historyRecords.push({ room: selectedRoomId, action: '返却', name, time: now });
      roomStatus[selectedRoomId] = '返却済み';
    } else {
      // 貸出処理
      if (nameCell) nameCell.textContent = name;
      if (row) {
        row.cells[2].textContent = now;
        row.cells[3].textContent = '';
        row.cells[4].textContent = '';
      }
      historyRecords.push({ room: selectedRoomId, action: '貸出', name, time: now });
      roomStatus[selectedRoomId] = '貸出中';
    }
 
    saveToLocalStorage();
    updateStatusBadges();
    closePopup();
  }
});
document.getElementById('historyBtn').addEventListener('click', showHistory);
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
      html += `<table border="1" style="width:250px;"><tr><th>操作</th><th>氏名</th><th>時間</th></tr>`;
      filtered.slice(i, i + chunkSize).forEach(r => {
        html += `<tr><td class="${r.action === '貸出' ? 'action-lend' : 'action-return'}">${r.action}</td><td>${r.name}</td><td>${r.time}</td></tr>`;
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
    document.getElementById('confirmNo').addEventListener('click', showActionForm);
  }
 
  function closePopup() {
    popup.style.display = 'none';
    overlay.style.display = 'none';
    popup.style.width = '400px';
  }
 
  // 管理者ページ処理
  const menuIcon = document.getElementById('menuIcon');
  const adminOverlay = document.getElementById('adminOverlay');
  const adminPopup = document.getElementById('adminPopup');
  const adminLoginSection = document.getElementById('adminLoginSection');
  const adminPanel = document.getElementById('adminPanel');
  const adminClose = document.getElementById('adminClose');
 
  menuIcon.addEventListener('click', () => {
    adminOverlay.style.display = 'block';
    adminPopup.style.display = 'block';
    adminLoginSection.style.display = 'block';
    adminPanel.style.display = 'none';
  });
 
  adminClose.addEventListener('click', () => {
    adminOverlay.style.display = 'none';
    adminPopup.style.display = 'none';
  });
 
  document.getElementById('adminLoginBtn').addEventListener('click', () => {
    const password = document.getElementById('adminPassword').value;
    if (password === 'ASH') {
      adminLoginSection.style.display = 'none';
      adminPanel.style.display = 'block';
      populateRoomHistoryList();
      document.getElementById('adminPassword').value = ''; // ← これを追加
      populateRenameSelect(); // ⬅ 教室名変更の選択肢をセット
    } else {
      alert('パスワードが違います');
    }
  });
 
  function populateRoomHistoryList() {
    const list = document.getElementById('roomHistoryList');
    list.innerHTML = '';
    const countByRoom = {};
    historyRecords.forEach(r => {
      const name = document.getElementById(r.room)?.querySelector('.room-name')?.textContent || r.room;
      countByRoom[name] = (countByRoom[name] || 0) + 1;
    });
    Object.keys(countByRoom).forEach(name => {
      const li = document.createElement('li');
      li.className = 'room-history';
      li.textContent = `${name}（${countByRoom[name]}件）`;
      list.appendChild(li);
    });
 
    document.querySelectorAll('.room-history').forEach(el => {
      el.addEventListener('click', () => {
        const name = el.textContent.split('（')[0];
        document.getElementById('adminSelect').value = name;
        document.getElementById('renameSelect').value = name;
      });
    });
  }
 
  document.getElementById('deleteHistoryBtn').addEventListener('click', () => {
    const roomName = document.getElementById('adminSelect').value;
    const dateText = document.getElementById('adminDate').value.trim();
    const msg = document.getElementById('adminMessage');
    msg.textContent = '';
    if (!roomName || !dateText) {
      msg.textContent = '教室名と日付を入力してください';
      return;
    }
 
    const before = historyRecords.length;
    historyRecords = historyRecords.filter(r => {
      const name = document.getElementById(r.room)?.querySelector('.room-name')?.textContent || r.room;
      return !(name === roomName && r.time.startsWith(dateText));
    });
    const after = historyRecords.length;
    saveToLocalStorage();
    msg.textContent = `${before - after} 件の履歴を削除しました。`;
    populateRoomHistoryList();
  });
 
  // ✅ 教室名変更機能実装
  function populateRenameSelect() {
    const renameSelect = document.getElementById('renameSelect');
    renameSelect.innerHTML = '';
    document.querySelectorAll('.clickable .room-name').forEach(el => {
      const name = el.textContent;
      const option = document.createElement('option');
      option.value = name;
      option.textContent = name;
      renameSelect.appendChild(option);
    });
  }
 
  document.getElementById('renameRoomBtn').addEventListener('click', () => {
    const oldName = document.getElementById('renameSelect').value;
    const newName = document.getElementById('newRoomName').value.trim();
    const msg = document.getElementById('renameMessage');
    if (!oldName || !newName) {
      msg.textContent = '教室と新しい名前を入力してください';
      return;
    }
 
    document.querySelectorAll('.room-name').forEach(el => {
      if (el.textContent === oldName) el.textContent = newName;
    });
 
    const adminSelect = document.getElementById('adminSelect');
    [...adminSelect.options].forEach(opt => {
      if (opt.value === oldName) {
        opt.value = opt.textContent = newName;
      }
    });
 
    populateRoomHistoryList();
    populateRenameSelect();
    msg.textContent = `${oldName} を ${newName} に変更しました。`;
  });
 
  document.getElementById('addEmployeeBtn').addEventListener('click', () => {
 
  const number = document.getElementById('newEmpNumber').value.trim();
 
  const name = document.getElementById('newEmpName').value.trim();
 
  const msg = document.getElementById('employeeAddMessage');
 
  msg.textContent = '';
 
  if (!/^\d{7}$/.test(number)) {
 
    msg.textContent = '⚠️ 従業員番号は7桁の数字で入力してください';
 
    return;
 
  }
 
  if (!name) {
 
    msg.textContent = '⚠️ 氏名を入力してください';
 
    return;
 
  }
 
  if (employeeData[number]) {
 
    msg.textContent = '⚠️ その従業員番号はすでに存在します';
 
    return;
 
  }
 
  employeeData[number] = name;
 
  localStorage.setItem('employeeData', JSON.stringify(employeeData));
 
  msg.textContent = `✅ ${name} さんを追加しました`;
 
  document.getElementById('newEmpNumber').value = '';
 
  document.getElementById('newEmpName').value = '';
 
});
 
 
});
 
 
 
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
  const popup = document.getElementById('popup');
  const overlay = document.getElementById('overlay');
  const popupContent = document.getElementById('popup-content');
  const closeIcon = document.getElementById('closeIcon');
 
  document.querySelectorAll('.status.returned').forEach(badge => {
    badge.textContent = '✅';
  });
 
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
      document.getElementById('employeeNumber').focus();
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
  const status = roomStatus[selectedRoomId];
 
 let buttonsHtml = `
  <button id="historyBtn" class="popup-button">📝履歴を見る</button>
`;
 
 
  popupContent.innerHTML = `
    <h2>🔑 ${selectedRoomName} の操作</h2>
    <input type="text" id="employeeNumber" placeholder="従業員番号を入力" /><br><br>
    <div id="employeeNameDisplay" style="margin-top: 5px; font-weight: bold;"></div>
    <div class="popup-buttons">
      ${buttonsHtml}
    </div>
  `;
 
  // 要素取得とフォーカス
  const empInput = document.getElementById('employeeNumber');
  const nameDisplay = document.getElementById('employeeNameDisplay');
 
  // 入力イベント（半角変換＋7桁制限＋名前表示）
empInput.addEventListener('input', () => {
  // 全角→半角変換
  empInput.value = empInput.value.replace(/[Ａ-Ｚａ-ｚ０-９]/g, s =>
    String.fromCharCode(s.charCodeAt(0) - 0xFEE0)
  );
 
  // 7桁制限
  if (empInput.value.length > 7) {
    empInput.value = empInput.value.slice(0, 7);
  }
 
  // 7桁入力されたら自動処理
  const name = employeeData[empInput.value]; // ← これを追加
if (empInput.value.length === 7 && name) {
    const now = getFormattedDateTime();
    const row = document.getElementById(selectedRoomId).parentElement;
    const shortId = selectedRoomId.replace('room-', '');
    const nameCell = document.getElementById('name-' + shortId);
 
    if (roomStatus[selectedRoomId] === '貸出中') {
      // 返却処理
      if (row) {
        row.cells[3].textContent = now;
        row.cells[4].textContent = name;
      }
      historyRecords.push({ room: selectedRoomId, action: '返却', name, time: now });
      roomStatus[selectedRoomId] = '返却済み';
    } else {
      // 貸出処理
      if (nameCell) nameCell.textContent = name;
      if (row) {
        row.cells[2].textContent = now;
        row.cells[3].textContent = '';
        row.cells[4].textContent = '';
      }
      historyRecords.push({ room: selectedRoomId, action: '貸出', name, time: now });
      roomStatus[selectedRoomId] = '貸出中';
    }
 
    saveToLocalStorage();
    updateStatusBadges();
    closePopup();
  }
});
document.getElementById('historyBtn').addEventListener('click', showHistory);
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
      html += `<table border="1" style="width:250px;"><tr><th>操作</th><th>氏名</th><th>時間</th></tr>`;
      filtered.slice(i, i + chunkSize).forEach(r => {
        html += `<tr><td class="${r.action === '貸出' ? 'action-lend' : 'action-return'}">${r.action}</td><td>${r.name}</td><td>${r.time}</td></tr>`;
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
    document.getElementById('confirmNo').addEventListener('click', showActionForm);
  }
 
  function closePopup() {
    popup.style.display = 'none';
    overlay.style.display = 'none';
    popup.style.width = '400px';
  }
 
  // 管理者ページ処理
  const menuIcon = document.getElementById('menuIcon');
  const adminOverlay = document.getElementById('adminOverlay');
  const adminPopup = document.getElementById('adminPopup');
  const adminLoginSection = document.getElementById('adminLoginSection');
  const adminPanel = document.getElementById('adminPanel');
  const adminClose = document.getElementById('adminClose');
 
  menuIcon.addEventListener('click', () => {
    adminOverlay.style.display = 'block';
    adminPopup.style.display = 'block';
    adminLoginSection.style.display = 'block';
    adminPanel.style.display = 'none';
  });
 
  adminClose.addEventListener('click', () => {
    adminOverlay.style.display = 'none';
    adminPopup.style.display = 'none';
  });
 
  document.getElementById('adminLoginBtn').addEventListener('click', () => {
    const password = document.getElementById('adminPassword').value;
    if (password === 'ASH') {
      adminLoginSection.style.display = 'none';
      adminPanel.style.display = 'block';
      populateRoomHistoryList();
      document.getElementById('adminPassword').value = ''; // ← これを追加
      populateRenameSelect(); // ⬅ 教室名変更の選択肢をセット
    } else {
      alert('パスワードが違います');
    }
  });
 
  function populateRoomHistoryList() {
    const list = document.getElementById('roomHistoryList');
    list.innerHTML = '';
    const countByRoom = {};
    historyRecords.forEach(r => {
      const name = document.getElementById(r.room)?.querySelector('.room-name')?.textContent || r.room;
      countByRoom[name] = (countByRoom[name] || 0) + 1;
    });
    Object.keys(countByRoom).forEach(name => {
      const li = document.createElement('li');
      li.className = 'room-history';
      li.textContent = `${name}（${countByRoom[name]}件）`;
      list.appendChild(li);
    });
 
    document.querySelectorAll('.room-history').forEach(el => {
      el.addEventListener('click', () => {
        const name = el.textContent.split('（')[0];
        document.getElementById('adminSelect').value = name;
        document.getElementById('renameSelect').value = name;
      });
    });
  }
 
  document.getElementById('deleteHistoryBtn').addEventListener('click', () => {
    const roomName = document.getElementById('adminSelect').value;
    const dateText = document.getElementById('adminDate').value.trim();
    const msg = document.getElementById('adminMessage');
    msg.textContent = '';
    if (!roomName || !dateText) {
      msg.textContent = '教室名と日付を入力してください';
      return;
    }
 
    const before = historyRecords.length;
    historyRecords = historyRecords.filter(r => {
      const name = document.getElementById(r.room)?.querySelector('.room-name')?.textContent || r.room;
      return !(name === roomName && r.time.startsWith(dateText));
    });
    const after = historyRecords.length;
    saveToLocalStorage();
    msg.textContent = `${before - after} 件の履歴を削除しました。`;
    populateRoomHistoryList();
  });
 
  // ✅ 教室名変更機能実装
  function populateRenameSelect() {
    const renameSelect = document.getElementById('renameSelect');
    renameSelect.innerHTML = '';
    document.querySelectorAll('.clickable .room-name').forEach(el => {
      const name = el.textContent;
      const option = document.createElement('option');
      option.value = name;
      option.textContent = name;
      renameSelect.appendChild(option);
    });
  }
 
  document.getElementById('renameRoomBtn').addEventListener('click', () => {
    const oldName = document.getElementById('renameSelect').value;
    const newName = document.getElementById('newRoomName').value.trim();
    const msg = document.getElementById('renameMessage');
    if (!oldName || !newName) {
      msg.textContent = '教室と新しい名前を入力してください';
      return;
    }
 
    document.querySelectorAll('.room-name').forEach(el => {
      if (el.textContent === oldName) el.textContent = newName;
    });
 
    const adminSelect = document.getElementById('adminSelect');
    [...adminSelect.options].forEach(opt => {
      if (opt.value === oldName) {
        opt.value = opt.textContent = newName;
      }
    });
 
    populateRoomHistoryList();
    populateRenameSelect();
    msg.textContent = `${oldName} を ${newName} に変更しました。`;
  });

  document.getElementById('addEmployeeBtn').addEventListener('click', () => {
  const number = document.getElementById('newEmpNumber').value.trim();
  const name = document.getElementById('newEmpName').value.trim();
  const msg = document.getElementById('employeeAddMessage');

  msg.textContent = '';

  if (!/^\d{7}$/.test(number)) {
    msg.textContent = '⚠️ 従業員番号は7桁の数字で入力してください';
    return;
  }

  if (!name) {
    msg.textContent = '⚠️ 氏名を入力してください';
    return;
  }

  if (employeeData[number]) {
    msg.textContent = '⚠️ その従業員番号はすでに存在します';
    return;
  }

  employeeData[number] = name;
  localStorage.setItem('employeeData', JSON.stringify(employeeData));
  msg.textContent = `✅ ${name} さんを追加しました`;
  document.getElementById('newEmpNumber').value = '';
  document.getElementById('newEmpName').value = '';
});


});
 
 
