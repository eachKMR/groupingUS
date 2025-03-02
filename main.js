'use strict';

import { handleFileChange } from './fileHandlers.js';
import { handleGroupAssignment } from './groupAssignment.js';
// 定数の定義
import { FURIGANA_INITIALS } from "./shareData.js";

import { prepareAttendeeData } from './fileHandlers.js';
import { updateGroupSettings, isGroupingBySize, getGroupSizeSelect, getRoundSizeSelect, setRoundSize,
     registerGroupOptionChangeHandler, registerGroupSizeChangeHandler } from './GroupSettings.js';

document.addEventListener('DOMContentLoaded', function() {
    // ファイル入力フィールドに変更があったときの処理を登録
    document.getElementById('xlsx-file-input').addEventListener('change', handleFileChange);

    
    // ラウンド数セレクトの初期化
    const roundSizeSelect = getRoundSizeSelect();
    // 数値が変更されたときの処理を登録
    roundSizeSelect.addEventListener('change', (event) => {
        setRoundSize( parseInt(event.target.value, 10) );
    });

    // グループ数セレクトの初期化
    const groupSizeSelect = getGroupSizeSelect();
    // ラジオボタンの選択が変更されたときの処理を登録
    registerGroupOptionChangeHandler(groupSizeSelect);
    // 数値が変更されたときの処理を登録
    registerGroupSizeChangeHandler(groupSizeSelect);

    // 「グループ決め」ボタンがクリックされたときの処理を登録
    document.getElementById('group-button').addEventListener('click', handleGroupAssignment);
});
