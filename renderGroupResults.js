'use strict';

// 必要な関数をインポート
import { saveGroupResult } from './saveGroupResult.js';
import { createPresentCorporateGroups, assignBalancedGroups, calculateNumGroups } from './groupAssignment.js';

// モジュールスコープの変数として宣言
let groupAssignments;

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
export function renderGroupResults(assignments, previousMembers) {
  const groupResultsDiv = document.getElementById('group-results');

  groupResultsDiv.innerHTML = ''; // 既存の内容をクリア
  // console.log('Previous members:', previousMembers);

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

      // グループのメンバーを確定
      let groupMembers = group.map(attendee => {
        const tdName = document.createElement('td');
        tdName.textContent = escapeHtml(attendee.name);
        tdName.style.borderLeft = 'solid 1px'; // 縦罫線を追加

        return { attendee, tdName };
      });

      // グループメンバーの氏名と所属を追加
      groupMembers.forEach(({ attendee, tdName }) => {
        row.appendChild(tdName);

        const tdDepartment = document.createElement('td');
        tdDepartment.textContent = escapeHtml(attendee.department);
        row.appendChild(tdDepartment);
      });

      // 条件判定とセルの色変更を追加
      groupMembers.forEach(({ attendee }) => {
        const otherMembers = group.filter(g => g.name !== attendee.name);
        // console.log(`Other members in the current group for ${attendee.name}:`, otherMembers);

        otherMembers.forEach(om => {
          const previousGroup = previousMembers.get(om.name);
          // console.log(`Previous group for ${om.name}:`, previousGroup);
          if (previousGroup && previousGroup.filter(name => name === attendee.name).length > 1) {
            // console.log(`Member ${attendee.name} has been in the same group with others more than once.`);
            const otherMember = groupMembers.find(member => member.attendee.name === om.name);
            if (otherMember) {
              otherMember.tdName.style.backgroundColor = 'yellow';
            }
          }
        });
      });

      tbody.appendChild(row);
    });

    table.appendChild(thead);
    table.appendChild(tbody);
    roundDiv.appendChild(table);
    groupResultsDiv.appendChild(roundDiv);
  });
}

// グループ分け結果を表示するモーダルウィンドウを管理する関数
export function displayResultsModal(initialGroupAssignments, previousMembers) {
    groupAssignments = initialGroupAssignments; // 初期値を設定

    // オーバーレイとモーダルウィンドウの要素を取得
    const overlay = document.getElementById('overlay');
    const modal = document.getElementById('modal');
    const regroupButton = document.getElementById('regroup-button');
    const confirmSaveButton = document.getElementById('confirm-save-button');

    // オーバーレイを表示
    overlay.classList.add('show');
    overlay.classList.remove('hide');
    modal.classList.add('show');
    modal.classList.remove('hide');

    // オーバーレイをクリックしたときにモーダルウィンドウを閉じる
    overlay.addEventListener('click', hideModal);

    // モーダルウィンドウを表示する関数
    function showModal() {
        modal.classList.add('show');
        modal.classList.remove('hide');
        overlay.classList.add('show');
        overlay.classList.remove('hide');
    }

    // モーダルウィンドウを非表示にする関数
    function hideModal() {
        modal.classList.add('hide');
        modal.classList.remove('show');
        overlay.classList.add('hide');
        overlay.classList.remove('show');
    }

    // 初回のグループ分け結果を表示
    renderGroupResults(groupAssignments, previousMembers);

    // モーダルウィンドウを表示
    showModal();

    // ボタンのイベントリスナーを設定
    regroupButton.addEventListener('click', function () {
        const presentCorporateGroups = createPresentCorporateGroups();
        if (!calculateNumGroups(presentCorporateGroups)) {
            return;
        }

        const { assignments, previousMembers: newPreviousMembers } = assignBalancedGroups(presentCorporateGroups);
        renderGroupResults(assignments, newPreviousMembers);
        groupAssignments = assignments; // 新しいグループ分け結果を保存
        previousMembers = newPreviousMembers; // 新しい previousMembers を保存
    });

    confirmSaveButton.addEventListener('click', function () {
        saveGroupResult(groupAssignments);
    });
}