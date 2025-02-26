'use strict';

import { handleFileChange } from './fileHandlers.js';
import { handleGroupAssignment } from './groupAssignment.js';
// 定数の定義
import { COLUMN_CORPORATE_NAME, COLUMN_DEPARTMENT, COLUMN_NAME,
    COLUMN_FURIGANA, COLUMN_PRESENT, 
    initializeGroupSize,
    initializeRoundSize,
    getRoundSize,
    setRoundSize} from "./shareData.js"; // attendees配列について各列のインデックス
import { GROUP_SIZE, getGroupSize, setGroupSize, getMinGroupSize, ROUND_SIZE } from "./shareData.js";
import { FURIGANA_INITIALS } from "./shareData.js";
import { attendees } from "./shareData.js";
import { setNumGroups, getNumGroups, isErrorNumGroups } from './shareData.js';
import { corporateGroups } from './shareData.js';

import { prepareAttendeeData } from './fileHandlers.js';
import { updateGroupSettings, isGroupingBySize } from './GroupSettings.js';

document.addEventListener('DOMContentLoaded', function() {
    // ファイル入力フィールドに変更があったときの処理を登録
    document.getElementById('xlsx-file-input').addEventListener('change', handleFileChange);

    const groupSizeSelect = document.getElementById('group-size-select');
    for (let i = 2; i <= 30; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = i;
        groupSizeSelect.appendChild(option);
    }
    initializeGroupSize();  // グループサイズを初期化
    groupSizeSelect.value = getGroupSize();  // デフォルトのグループサイズを設定

    const roundSizeSelect = document.getElementById('round-size-select');
    for (let i = 1; i <= 10; i++) { // 例として1から10までのラウンド数を設定
        const option = document.createElement('option');
        option.value = i;
        option.textContent = i;
        roundSizeSelect.appendChild(option);
    }
    initializeRoundSize();  // ラウンド数を初期化
    roundSizeSelect.value = getRoundSize();  // デフォルトのラウンド数を設定

    // 数値が変更されたときの処理を登録
    roundSizeSelect.addEventListener('change', (event) => {
        setRoundSize( parseInt(event.target.value, 10) );
    });

    // 数値が変更されたときの処理を登録
    groupSizeSelect.addEventListener('change', (event) => {
        const selectedValue = parseInt(event.target.value, 10);
        const selectedOption = document.querySelector('input[name="group-option"]:checked').value;
        updateGroupSettings(selectedValue, selectedOption);
    });

    // ラジオボタンの選択が変更されたときの処理を登録
    document.querySelectorAll('input[name="group-option"]').forEach(radio => {
        radio.addEventListener('change', () => {
            const selectedValue = parseInt(groupSizeSelect.value, 10);
            const selectedOption = document.querySelector('input[name="group-option"]:checked').value;
            updateGroupSettings(selectedValue, selectedOption);
        });
    });

    // 「グループ決め」ボタンがクリックされたときの処理を登録
    document.getElementById('group-button').addEventListener('click', handleGroupAssignment);
});
