import { getCountOfAttendees } from './shareData.js';

'use strict';

// 最低試行人数の定数を宣言
const MINIMUM_ATTENDEES = 5;

//--------------------------------------------------------------
// grouping-container を有効化する関数（グループ分けの設定を有効化）
//--------------------------------------------------------------
export function enableGroupingContainer() {
    const countOfAttendees = getCountOfAttendees();
    if (countOfAttendees < MINIMUM_ATTENDEES) {
        alert(`出席者数が ${MINIMUM_ATTENDEES} 人未満のため、グループ分けの設定は有効化されません。`);
        console.log(`出席者数が ${MINIMUM_ATTENDEES} 人未満のため、グループ分けの設定は有効化されません。`);
        return;
    }
    const groupingContainer = document.querySelector('.grouping-container');
    groupingContainer.classList.remove('disabled');
    groupingContainer.querySelectorAll('select, input, .group-button').forEach(element => {
        element.disabled = false;
    });
    initializeRoundSizeSelect();
    initializeGroupSizeSelect();
}

//--------------------------------------------------------------
// ラウンド数関連の変数及び函数の宣言
//--------------------------------------------------------------
let roundSize = 0; // グループ分けのラウンド数
const INITIAL_ROUND_SIZE = 3; // ラウンド数の初期値（３ラウンド）
const MAX_ROUND_SIZE = 10; // ラウンド数の最大値（１０ラウンド）
export function getRoundSize() { return roundSize; }
export function setRoundSize(value) { roundSize = value; }
export function initializeRoundSize() { roundSize = INITIAL_ROUND_SIZE; }

//--------------------------------------------------------------
// ラウンド数選択用のセレクトボックスを取得する関数及び初期化関数の宣言
//--------------------------------------------------------------
const roundSizeSelect = document.getElementById('round-size-select');
export function getRoundSizeSelect() { return roundSizeSelect; }
export function initializeRoundSizeSelect() {
    for (let i = 1; i <= MAX_ROUND_SIZE; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = i;
        roundSizeSelect.appendChild(option);
    }
    initializeRoundSize();
    roundSizeSelect.value = getRoundSize();
}

//--------------------------------------------------------------
// グループあたり人数関連の変数及び函数の宣言
//--------------------------------------------------------------
let groupSize = 0;
const INITIAL_GROUP_SIZE = 4; // グループの初期サイズ（４名）
const MAX_GROUP_SIZE = 10; // グループの最大サイズ（１０名）
export function getGroupSize() { return groupSize; }
export function setGroupSize(value) { groupSize = value; }

// 元々の機能を持つ新しい関数
export function getAdjustedMinGroupSize() { return groupSize - 1 ; } // グループの調整された最小サイズ

// 現在の機能を持つ関数
export function getMinGroupSize() { return 2; } // グループの最小サイズ
export function getMaxGroupSize() { return MAX_GROUP_SIZE; } 

//--------------------------------------------------------------
// グループ数関連の変数及び函数の宣言
//--------------------------------------------------------------
let numGroups = 0; // グループ数
export function getNumGroups() { return numGroups; }
export function setNumGroups(value) { numGroups = value; }

export function getMinNumGroups() { return Math.ceil(getCountOfAttendees() / getMaxGroupSize()); }
export function getMaxNumGroups() { return Math.ceil(getCountOfAttendees() / getMinGroupSize()); }
export function isErrorNumGroups() { return numGroups === 0; }

//--------------------------------------------------------------
// グループ（人）数選択用のセレクトボックスを取得する関数及び初期化関数の宣言
//--------------------------------------------------------------
const groupSizeSelect = document.getElementById('group-size-select');
export function getGroupSizeSelect() { return groupSizeSelect; }
export function initializeGroupSizeSelect() {
    groupSizeSelect.innerHTML = ''; // セレクトボックスの中身をクリア
    if (isGroupingBySize()) {
        console.log(`getMinGroupSize:${getMinGroupSize()} getMaxGroupSize:${getMaxGroupSize()}`);
        for (let i = getMinGroupSize(); i <= getMaxGroupSize(); i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = i;
            groupSizeSelect.appendChild(option);
        }
        setGroupSize(INITIAL_GROUP_SIZE);
        groupSizeSelect.value = getGroupSize();
        console.log(`groupSize updated to:${getGroupSize()}`);
        updateGroupSettings();
    } else {
        for (let i = getMinNumGroups(); i <= getMaxNumGroups(); i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = i;
            groupSizeSelect.appendChild(option);
        }
        // setNumGroups(getMinNumGroups());
        groupSizeSelect.value = getNumGroups();
        console.log(`numGroups updated to:${getNumGroups()}`);
        // updateGroupSettings();
    }
}

// グループ分けの基準を判定する関数
export function isGroupingBySize() {
    const groupOption = document.querySelector('input[name="group-option"]:checked');
    return groupOption && groupOption.value === 'size';
}

// グループ分け基準（人数or数）オプションの選択が変更されたときの処理を登録する関数
export function registerGroupOptionChangeHandler() {
    const groupOptionRadios = document.querySelectorAll('input[name="group-option"]');
    groupOptionRadios.forEach(radio => {
        radio.addEventListener('change', (event) => {
            updateGroupSettings();          // グループ分け基準の数値を更新
            initializeGroupSizeSelect();    // グループ分け基準の数値を初期化
        });
    });
}

// グループ分け基準の数値が変更されたときの処理を登録する関数
export function registerGroupSizeChangeHandler() {
    groupSizeSelect.addEventListener('change', (event) => {
        updateGroupSettings();  // グループ分け基準の数値を更新
    });
}

// グループ分け基準の数値を更新する関数
export function updateGroupSettings() {
    console.log(`groupSizeSelect.value:${groupSizeSelect.value}`);
    if (isGroupingBySize()) {   // ラジオボタンが「グループ人数」の場合
        if (parseInt(groupSizeSelect.value) > getMaxGroupSize()) {
            alert(`グループあたりの人数は${getMaxGroupSize()}以下にしてください。`);
            setGroupSize(getMaxGroupSize());
            groupSizeSelect.value = getGroupSize();
        } else {
            const parsedValue = parseInt(groupSizeSelect.value);
            console.log(`parsedValue(size): ${parsedValue}`); // デバッグ用ログ出力
            setGroupSize(parsedValue);
        }
        setNumGroups(Math.ceil(getCountOfAttendees() / getGroupSize()));
        console.log(`groupSize updated to:${getGroupSize()} numGroups updated to:${getNumGroups()}`);
    } else {                    // ラジオボタンが「グループ数」の場合
        if (parseInt(groupSizeSelect.value) < getMinNumGroups()) {
            alert(`グループ数は${getMinNumGroups()}以上にしてください。`);
            setNumGroups(getMinNumGroups());
            groupSizeSelect.value = getNumGroups();
        } else {
            const parsedValue = parseInt(groupSizeSelect.value);
            console.log(`parsedValue(count): ${parsedValue}`); // デバッグ用ログ出力
            setNumGroups(parsedValue);
        }
        setGroupSize(Math.ceil(getCountOfAttendees() / getNumGroups()));
        console.log(`groupSize updated to:${getGroupSize()} numGroups updated to:${getNumGroups()}`);
    }
}

// 法人ごとの出席者リストを保持するマップ及び関数の宣言
export const corporateGroups = new Map();
export function clearCorporateGroups() { corporateGroups.clear(); }
export function setCorporateGroup(key, value) { corporateGroups.set(key, value); }
export function getCorporateGroup(key) { return corporateGroups.get(key); }
export function getCorporateGroups() { return corporateGroups; }

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

