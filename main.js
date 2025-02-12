import { handleFileChange } from './fileHandlers.js';
import { handleGroupAssignment } from './groupAssignment.js';
// 定数の定義
import { COLUMN_CORPORATE_NAME,COLUMN_DEPARTMENT,COLUMN_NAME,
        COLUMN_FURIGANA,COLUMN_PRESENT } from "./shareData.js"; // attendees配列について各列のインデックス
import { GROUP_SIZE,MIN_GROUP_SIZE,ROUND_SIZE } from "./shareData.js";
import { FURIGANA_INITIALS } from "./shareData.js";
import { attendees } from "./shareData.js";
import { setNumGroups, getNumGroups, isErrorNumGroups } from './shareData.js';
import { corporateGroups } from './shareData.js';

import { prepareAttendeeData } from './fileHandlers.js';


'use strict';
{
    // ページの読み込みが完了したら実行
    document.addEventListener('DOMContentLoaded', function() {
        // ファイル入力フィールドに変更があったときの処理を登録
        document.getElementById('xlsx-file-input').addEventListener('change', handleFileChange);

        // 「グループ決め」ボタンがクリックされたときの処理を登録
        document.getElementById('group-button').addEventListener('click', handleGroupAssignment);
    });
}
