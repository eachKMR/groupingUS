import { COLUMN_CORPORATE_NAME, COLUMN_DEPARTMENT, COLUMN_NAME, COLUMN_FURIGANA, COLUMN_PRESENT,
    GROUP_SIZE, MIN_GROUP_SIZE, ROUND_SIZE,
    FURIGANA_INITIALS,
    attendees,
    corporateGroups,
    clearCorporateGroups, setCorporateGroup, 
    setNumGroups,
    getNumGroups,
    isErrorNumGroups } from './shareData.js';

'use strict';

// シャッフル関数（フィッシャー・イェーツのシャッフル）
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// 出席者をフィルタリングして presentCorporateGroups を作成する関数
function createPresentCorporateGroups() {
    const presentCorporateGroups = new Map();
    corporateGroups.forEach((group, corporateName) => {
        const filteredGroup = group.filter(attendee => attendee.present === 1);
        if (filteredGroup.length > 0) {
            presentCorporateGroups.set(corporateName, filteredGroup);
        }
    });
    console.log('presentCorporateGroups:', presentCorporateGroups);
    return presentCorporateGroups;
}

// グループ数を計算する関数
function calculateNumGroups(presentCorporateGroups) {
    const totalAttendees = Array.from(presentCorporateGroups.values()).flat().length;
    setNumGroups(Math.ceil(totalAttendees / GROUP_SIZE));
    console.log('calculateNumGroups:num_groups:', getNumGroups());
    if (isErrorNumGroups()) {
        console.error('Error: isErrorNumGroups() === true. Cannot assign groups.');
        alert('グループ分けできません。出席者がいないか、１グループあたりの人数が大きすぎます。');
        return false;
    }
    return true;
}

// グループ分けボタンがクリックされたときの処理
export function handleGroupAssignment() {
    console.log('handleGroupAssignment called', corporateGroups);

    const presentCorporateGroups = createPresentCorporateGroups();
    if (!calculateNumGroups(presentCorporateGroups)) {
        return;
    }

    // グループ分けを実行
    const balancedGroupAssignments = assignBalancedGroups(presentCorporateGroups);
    console.log('balancedGroupAssignments:', balancedGroupAssignments);
    // グループ分け結果を表示
    displayGroupResults(balancedGroupAssignments);
}

// グループ分けを実行する関数
export function assignBalancedGroups(presentCorporateGroups) {
    console.log('assignBalancedGroups called', presentCorporateGroups);
    console.log('num_groups:', getNumGroups());

    if (isErrorNumGroups()) {
        throw new Error('num_groups is 0. これじゃグループ分けができないよ！');
    }

    const assignments = []; // グループ分けの結果を格納する配列
    // 各出席者が過去に同じグループに入った出席者を記録するオブジェクト
    const previousMembers = {};

    // 法人ごとの出席者リストを配列化して、操作しやすくする
    const corporateGroupsArray = Array.from(presentCorporateGroups.values());

    // 指定されたラウンド数だけグループ分けを行う
    for (let round = 0; round < ROUND_SIZE; round++) {
        // groups（配列）をnum_groups個の空の配列で初期化する
        let groups = Array.from({ length: getNumGroups() }, () => []);
        console.log('groups:', groups);

        // 法人ごとの出席者リストをシャッフルしてランダムな順序にする
        corporateGroupsArray.forEach(group => shuffle(group));
        console.log('corporateGroupsArray:', corporateGroupsArray);

        // 各法人ごとにグループに割り当てる
        corporateGroupsArray.forEach(corporate => {
            console.log('assigned corporate:', corporate);
            let groupIndex = 0;
            let attempts = 0; // attempts 変数を宣言
            corporate.forEach(attendee => {
                // 過去に同じグループに入った出席者を避ける
                while (previousMembers[attendee.name] && previousMembers[attendee.name].some(member => groups[groupIndex].includes(member))) {
                    groupIndex = (groupIndex + 1) % getNumGroups();
                    attempts++;
                    if (attempts >= getNumGroups()) {
                        break; // 無限ループを回避するためにループを抜ける
                    }
                }
                groups[groupIndex].push(attendee);
                if (!previousMembers[attendee.name]) {
                    previousMembers[attendee.name] = [];
                }
                previousMembers[attendee.name].push(...groups[groupIndex].map(member => member.name));
                groupIndex = (groupIndex + 1) % getNumGroups();
            });
        });
        console.log('previousMembers:', previousMembers);

        // グループのサイズを調整
        groups.forEach(group => {
            while (group.length > GROUP_SIZE) {
                const extraAttendee = group.pop();
                const smallestGroup = groups.reduce((smallest, current) => current.length < smallest.length ? current : smallest, groups[0]);
                smallestGroup.push(extraAttendee);
            }
        });

        // MIN_GROUP_SIZE人未満のグループに含まれている人たちを収集
        const smallGroups = groups.filter(group => group.length < MIN_GROUP_SIZE);
        const remainingAttendees = smallGroups.flat();

        // MIN_GROUP_SIZE人未満のグループを除外
        groups = groups.filter(group => group.length >= MIN_GROUP_SIZE);

        // MIN_GROUP_SIZE人未満のグループがある場合、GROUP_SIZE + 1を許容し、num_groupsを1つ減らす
        if (groups.length < getNumGroups()) {
            setNumGroups(groups.length);
            groups = Array.from({ length: getNumGroups() }, () => []);
            remainingAttendees.forEach((attendee, index) => {
                groups[index % getNumGroups()].push(attendee);
            });
        }

        // 現在のラウンドのグループ分け結果を assignments に追加
        assignments.push(groups);
        console.log(`round ${round + 1} `);
        console.log('assignments:', assignments);
    }

    // 全てのラウンドのグループ分け結果を返す
    return assignments;
}

// 偶数文字目を '●' に置き換える関数
function maskName(name) {
    return name.split('').map((char, index) => (index % 2 === 1 ? '●' : char)).join('');
}

// 出席者データを保存する関数
export function saveAttendance(groupAssignments) {
    console.log('Saving group assignments:', groupAssignments);

    const workbook = XLSX.utils.book_new();
    const worksheetData1 = [];
    const worksheetData2 = [];

    // Sheet1: グループごとの出席者リスト
    groupAssignments.forEach((assignment, round) => {
        worksheetData1.push([`グループワーク第${round + 1}回`]);
        assignment.forEach((group, index) => {
            const groupData = [`グループ ${index + 1}`, ...group.map(a => `${a.name}@${a.department}`)];
            worksheetData1.push(groupData);
        });
        worksheetData1.push([]); // 空行を追加
    });

    const worksheet1 = XLSX.utils.aoa_to_sheet(worksheetData1);
    XLSX.utils.book_append_sheet(workbook, worksheet1, 'Sheet1');

    // Sheet2: 出席者@部署を軸に各ラウンドのグループ番号を表示
    const attendeeMap = new Map();

    groupAssignments.forEach((assignment, round) => {
        assignment.forEach((group, index) => {
            group.forEach(attendee => {
                const key = `${attendee.name}@${attendee.department}`;
                if (!attendeeMap.has(key)) {
                    attendeeMap.set(key, { name: attendee.name, department: attendee.department, groups: [] });
                }
                attendeeMap.get(key).groups[round] = `グループ ${index + 1}`;
            });
        });
    });

    // 1行目に列名を追加
    const headerRow = ['氏名', '事業所', '法人名'];
    for (let i = 1; i <= groupAssignments.length; i++) {
        headerRow.push(`第${i}回`);
    }
    worksheetData2.push(headerRow);

    // 出席者データを追加
    corporateGroups.forEach((group, corporateName) => {
        group.forEach(attendee => {
            const key = `${attendee.name}@${attendee.department}`;
            if (attendeeMap.has(key)) {
                const data = attendeeMap.get(key);
                const maskedName = maskName(data.name);
                const row = [maskedName, data.department, corporateName, ...data.groups];
                worksheetData2.push(row);
            }
        });
    });

    const worksheet2 = XLSX.utils.aoa_to_sheet(worksheetData2);
    XLSX.utils.book_append_sheet(workbook, worksheet2, 'Sheet2');

    // ファイルを保存
    XLSX.writeFile(workbook, 'グループ分け.xlsx');
    console.log('File saved to グループ分け.xlsx');
}

// グループ分け結果を表示する関数
function displayGroupResults(groupAssignments) {
    // オーバーレイとモーダルウィンドウの要素を取得
    const overlay = document.getElementById('overlay');
    const modal = document.getElementById('modal');
    const groupResultsDiv = document.getElementById('group-results');
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
    function renderGroupResults(assignments) {
        console.log(`Rendering group assignments:`, assignments);
        groupResultsDiv.innerHTML = ''; // 既存の内容をクリア
    
        assignments.forEach((assignment, round) => {
            const roundDiv = document.createElement('div');
            roundDiv.textContent = `◆グループワーク第${round + 1}回:`;
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

    // 初回のグループ分け結果を表示
    renderGroupResults(groupAssignments);

    // モーダルウィンドウを表示
    showModal();

    // ボタンのイベントリスナーを設定
    regroupButton.addEventListener('click', function () {
        const presentCorporateGroups = createPresentCorporateGroups();
        if (!calculateNumGroups(presentCorporateGroups)) {
            return;
        }

        const balancedGroupAssignments = assignBalancedGroups(presentCorporateGroups);
        renderGroupResults(balancedGroupAssignments);
        groupAssignments = balancedGroupAssignments; // 新しいグループ分け結果を保存
    });

    confirmSaveButton.addEventListener('click', function () {
        saveAttendance(groupAssignments);
    });
}
