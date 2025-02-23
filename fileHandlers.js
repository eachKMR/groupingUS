import { COLUMN_CORPORATE_NAME, COLUMN_DEPARTMENT, COLUMN_NAME, COLUMN_FURIGANA, COLUMN_PRESENT, COLUMN_FIRSTGROUP,
        FURIGANA_INITIALS,
        attendees,
        clearAttendees, addAttendee,
        corporateGroups,
        clearCorporateGroups, setCorporateGroup } from './shareData.js';

'use strict';

let furiganaGroups = new Map(); // フリガナごとの出席者リストを保持するマップ

let corporations = []; // 法人名のリスト

let selectedCorporation = ''; // 現在選択されている法人名
let selectedFurigana = 'ア'; // 現在選択されているフリガナの初期文字

export function handleFileChange(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        // console.log('File selected:', file);
        reader.onload = handleFileLoad; // ファイル読み込み完了時の処理を登録
        reader.readAsArrayBuffer(file); // ファイルをバイナリ形式で非同期に読み込む
               // 読み込みが成功したら grouping-container を有効化する
               enableGroupingContainer();
    }
}

export function handleFileLoad(e) {
    console.log('File loaded:', e);
    try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const parsedAttendees = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        console.log('Parsed attendees:', parsedAttendees);
        clearAttendees(); // attendees配列を初期化
        parsedAttendees.forEach(row => addAttendee(row)); // パースしたデータをattendees配列に追加
        prepareAttendeeData();
    } catch (error) {
        console.error('Error reading file:', error);
        alert('ファイルの読み込み中にエラーが発生しました。');
    }
}

// ファイルが正しく読み込まれた後に grouping-container を有効化する関数
function enableGroupingContainer() {
    const groupingContainer = document.querySelector('.grouping-container');
    groupingContainer.classList.remove('disabled');
    groupingContainer.querySelectorAll('select, input, .group-button').forEach(element => {
        element.disabled = false;
    });
}

// 出席者データを準備する関数
export function prepareAttendeeData() {
    const companyMap = new Map();
    const furiganaMap = new Map(FURIGANA_INITIALS.map(initial => [initial, []]));
    attendees.forEach((attendee, index) => {
        if (index === 0) return;
        const [corporateName, department, name, furigana, present, firstGroup] = [
            attendee[COLUMN_CORPORATE_NAME],
            attendee[COLUMN_DEPARTMENT],
            attendee[COLUMN_NAME],
            attendee[COLUMN_FURIGANA],
            attendee[COLUMN_PRESENT],
            attendee[COLUMN_FIRSTGROUP] || '' // F列が空の場合は空文字列を設定
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
    console.log('corporateGroups:', corporateGroups);
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

// 最も多くの出席者を持つ法人名を取得する関数
export function getMostAttendeesCorporation() {
    let maxCount = 0;
    let mostAttendeesCorporation = '';
    corporateGroups.forEach((attendees, corporation) => {
        if (attendees.length > maxCount) {
            maxCount = attendees.length;
            mostAttendeesCorporation = corporation;
        }
    });
    return mostAttendeesCorporation;
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
        corporateGroups.forEach(attendees => {
            const attendee = attendees.find(attendee => attendee.index === index);
            if (attendee) {
                attendee.present = present;
            }
        });

        // attendees配列の対応する要素を更新
        const attendee = attendees[index];
        if (attendee) {
            attendee[COLUMN_PRESENT] = present;
        }
    });
    // console.log('Updated attendees:', attendees);
}