import { COLUMN_CORPORATE_NAME, COLUMN_DEPARTMENT, COLUMN_NAME, COLUMN_FURIGANA, COLUMN_PRESENT, COLUMN_FIRSTGROUP,
    FURIGANA_INITIALS,
    clearScheduledAttendees, addScheduledAttendee, getScheduledAttendees,
    setCountOfAttendees, getCountOfAttendees,
 } from './shareData.js'; // shareData.jsからインポート
import { enableGroupingContainer,
    clearCorporateGroups, getCorporateGroups, setCorporateGroup, getMostAttendeesCorporation,
 } from './GroupSettings.js'; // GroupSettingsからインポート

'use strict';

let furiganaGroups = new Map(); // フリガナごとの出席者リストを保持するマップ

let corporations = []; // 法人名のリスト

let selectedCorporation = ''; // 現在選択されている法人名
let selectedFurigana = 'ア'; // 現在選択されているフリガナの初期文字

// ファイル入力フィールドの変更時の処理
export function handleFileChange(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = handleFileLoad; // ファイル読み込み完了時の処理を登録
        reader.readAsArrayBuffer(file); // ファイルをバイナリ形式で非同期に読み込む
        // 読み込みが成功したら grouping-container を有効化する
        // enableGroupingContainer();
    }
}

// ファイル読み込み完了時の処理
export function handleFileLoad(e) {
    console.log('File loaded:', e);
    try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const parsedAttendees = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        console.log('Parsed attendees:', parsedAttendees);
        clearScheduledAttendees(); // scheduledAttendees配列を初期化
        parsedAttendees.forEach(row => addScheduledAttendee(row)); // パースしたデータをscheduledAttendees配列に追加
        prepareAttendeeData();
        setCountOfAttendees(parsedAttendees.length - 1); // 先頭行はヘッダー行なので除外
        // 読み込みが完了したらグループ分けコンテナを有効化する
        enableGroupingContainer();
    } catch (error) {
        console.error('Error reading file:', error);
        alert('ファイルの読み込み中にエラーが発生しました。');
    }
}

// 出席者データを準備する関数
export function prepareAttendeeData() {
    const scheduledAttendees = getScheduledAttendees();
    const companyMap = new Map();
    const furiganaMap = new Map(FURIGANA_INITIALS.map(initial => [initial, []]));
    scheduledAttendees.forEach((scheduled, index) => {
        if (index === 0) return;
        const [corporateName, department, name, furigana, present, firstGroup] = [
            scheduled[COLUMN_CORPORATE_NAME],
            scheduled[COLUMN_DEPARTMENT],
            scheduled[COLUMN_NAME],
            scheduled[COLUMN_FURIGANA],
            scheduled[COLUMN_PRESENT],
            scheduled[COLUMN_FIRSTGROUP] || '' // F列が空の場合は空文字列を設定
        ];
        if (!corporateName || !department || !name) return;
        if (!companyMap.has(corporateName)) {
            companyMap.set(corporateName, []);
        }
        companyMap.get(corporateName).push({ name, department, furigana, present, firstGroup, index });
        const initial = furigana ? getFuriganaInitial(furigana.charAt(0)) : 'その他';
        furiganaMap.get(initial).push({ corporateName, department, name, furigana, present, firstGroup, index });
    });

    // 出席者リストをフリガナ順にソート    
    furiganaMap.forEach((attendees, initial) => {
        attendees.sort((a, b) => (a.furigana || '').localeCompare(b.furigana || ''));
    });
    corporations = Array.from(companyMap.keys());
    furiganaGroups = furiganaMap;
    updateTabs('corporation-tabs', corporations, (corporateName) => {
        saveCheckboxState();
        selectedCorporation = corporateName;
        updateTable();
    });
    updateTabs('furigana-tabs', FURIGANA_INITIALS, (initial) => {
        saveCheckboxState();
        selectedFurigana = initial;
        updateTable();
    });
    clearCorporateGroups(); // 既存のデータをクリア
    companyMap.forEach((value, key) => setCorporateGroup(key, value)); // 新しいデータをセット
    console.log('furiganaGroups:', furiganaGroups);
    selectedCorporation = getMostAttendeesCorporation();
    updateTable();
}

export function getFuriganaInitial(char) {
    const ranges = [
        { initial: 'ア', range: /^[ア-オｱ-ｵ]/ },
        { initial: 'カ', range: /^[カ-コｶ-ｺ]/ },
        { initial: 'サ', range: /^[サ-ソｻ-ｿ]/ },
        { initial: 'タ', range: /^[タ-トﾀ-ﾄ]/ },
        { initial: 'ナ', range: /^[ナ-ノﾅ-ﾉ]/ },
        { initial: 'ハ', range: /^[ハ-ホﾊ-ﾎ]/ },
        { initial: 'マ', range: /^[マ-モﾏ-ﾓ]/ },
        { initial: 'ヤ', range: /^[ヤ-ヨﾔ-ﾖ]/ },
        { initial: 'ラ', range: /^[ラ-ロﾗ-ﾛ]/ },
        { initial: 'ワ', range: /^[ワ-ンﾜ-ﾝ]/ }
    ];
    for (const { initial, range } of ranges) {
        if (range.test(char)) {
            return initial;
        }
    }
    return 'その他';
}

// タブの内容を更新する関数
export function updateTabs(containerId, items, onClick) { // 引数：id, 法人名またはフリガナのリスト, クリック時の処理
    const tabsContainer = document.getElementById(containerId);
    tabsContainer.innerHTML = '';
    items.forEach(item => {
        const tab = document.createElement('div');
        tab.className = 'tab';
        tab.textContent = item;
        tab.onclick = () => onClick(item);
        tabsContainer.appendChild(tab);
    });
    const activeTab = Array.from(tabsContainer.children).find(tab =>
        tab.textContent === (containerId === 'corporation-tabs' ? selectedCorporation : selectedFurigana));
    if (activeTab) {
        activeTab.classList.add('active');
    }
}

// XSS攻撃に対応するため、HTMLエスケープ処理を行う
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// テーブルデータ<td>の内容を更新する関数
function updateTable() {
    const corporationTabs = document.querySelectorAll('#corporation-tabs .tab');
    corporationTabs.forEach(tab => {
        tab.classList.toggle('active', tab.textContent === selectedCorporation);
    });

    const furiganaTabs = document.querySelectorAll('#furigana-tabs .tab');
    furiganaTabs.forEach(tab => {
        tab.classList.toggle('active', tab.textContent === selectedFurigana);
    });

    const tbody = document.getElementById('attendees-body'); // テーブルのtbody要素を取得
    tbody.innerHTML = '';
    const corporateGroups = getCorporateGroups(); // corporateGroupsを取得
    if (selectedCorporation && corporateGroups.has(selectedCorporation)) { // 選択された法人名が出席者リストに存在する場合
        let attendees = corporateGroups.get(selectedCorporation).filter(attendee => {
            const initial = attendee.furigana ? getFuriganaInitial(attendee.furigana.charAt(0)) : 'その他';
            return initial === selectedFurigana;
        });

        attendees.sort((a, b) => (a.furigana || '').localeCompare(b.furigana || ''));

        // グループ分けに使用する全ての出席者リストを更新
        attendees.forEach(attendee => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><input type="checkbox" class="attendance-checkbox" 
                    data-index="${attendee.index}" 
                    ${attendee.present === 1 ? 'checked' : ''}>
                </td>
                <td>${escapeHtml(attendee.name)}</td>
                <td>${escapeHtml(attendee.furigana || '')}</td>
                <td>${escapeHtml(selectedCorporation)}</td>
                <td>${escapeHtml(attendee.department)}</td>
            `;
            const checkbox = row.querySelector('.attendance-checkbox');
            checkbox.onchange = saveCheckboxState;
            tbody.appendChild(row);
        });
    }
}

export function saveCheckboxState() {
    const checkboxes = document.querySelectorAll('.attendance-checkbox');
    checkboxes.forEach(checkbox => {
        const index = parseInt(checkbox.getAttribute('data-index'), 10); // チェックボックスのdata-index属性を取得
        const present = checkbox.checked ? 1 : 0; // presentの値を設定

        // corporateGroupsマップの各要素に対して
        const corporateGroups = getCorporateGroups(); // corporateGroupsを取得
        corporateGroups.forEach(attendees => {
            const attendee = attendees.find(attendee => attendee.index === index);
            if (attendee) {
                attendee.present = present;
            }
        });

        // scheduledAttendees配列の対応する要素を更新
        const attendee = getScheduledAttendees()[index];
        if (attendee) {
            attendee[COLUMN_PRESENT] = present;
        }
    });
    // console.log('Updated attendees:', attendees);
}