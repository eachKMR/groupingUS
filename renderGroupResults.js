'use strict';

// XSS対策のためのエスケープ関数
function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// グループ分け結果を表示する関数
export function renderGroupResults(assignments) {
  const groupResultsDiv = document.getElementById('group-results');

  console.log(`Rendering group assignments:`, assignments);
  groupResultsDiv.innerHTML = ''; // 既存の内容をクリア

  assignments.forEach((assignment, round) => {
    const roundDiv = document.createElement('div');
    roundDiv.textContent = `◆第${round + 1}回グループ分け:`;
    roundDiv.style.marginTop = '20px';
    roundDiv.style.font = 'bold 16px Meiryo sans-serif';

    const table = document.createElement('table');
    const thead = document.createElement('thead');
    const tbody = document.createElement('tbody');

    // テーブルのヘッダーを作成
    const headerRow = document.createElement('tr');
    const thGroupNumber = document.createElement('th');
    thGroupNumber.textContent = '番号';
    headerRow.appendChild(thGroupNumber);

    // グループごとに氏名と所属をヘッダーに追加
    for (let i = 0; i < assignment[0].length; i++) {
      const thName = document.createElement('th');
      thName.textContent = '氏名';
      thName.style.borderLeft = 'solid 1px'; // 縦罫線を追加
      headerRow.appendChild(thName);

      const thDepartment = document.createElement('th');
      thDepartment.textContent = '所属';
      headerRow.appendChild(thDepartment);
    }
    thead.appendChild(headerRow);

    // テーブルのボディを作成
    assignment.forEach((group, index) => {
      const row = document.createElement('tr');

      const tdGroupNumber = document.createElement('td');
      tdGroupNumber.textContent = `グループ ${index + 1}`;
      row.appendChild(tdGroupNumber);

      group.forEach(attendee => {
        const tdName = document.createElement('td');
        tdName.textContent = escapeHtml(attendee.name);
        tdName.style.borderLeft = 'solid 1px'; // 縦罫線を追加
        row.appendChild(tdName);

        const tdDepartment = document.createElement('td');
        tdDepartment.textContent = escapeHtml(attendee.department);
        row.appendChild(tdDepartment);
      });

      tbody.appendChild(row);
    });

    table.appendChild(thead);
    table.appendChild(tbody);
    roundDiv.appendChild(table);
    groupResultsDiv.appendChild(roundDiv);
  });
}