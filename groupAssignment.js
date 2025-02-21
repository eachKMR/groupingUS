import { COLUMN_CORPORATE_NAME, COLUMN_DEPARTMENT, COLUMN_NAME, COLUMN_FURIGANA, COLUMN_PRESENT,
    GROUP_SIZE, getGroupSize, setGroupSize, getMinGroupSize, ROUND_SIZE,
    FURIGANA_INITIALS,
    attendees,
    corporateGroups,
    clearCorporateGroups, setCorporateGroup, 
    setNumGroups,
    getNumGroups,
    isErrorNumGroups,
    getRoundSize, } from './shareData.js'; 

import { renderGroupResults, displayResultsModal } from './renderGroupResults.js';
// import { saveGroupResult } from './saveGroupResult.js'; // 不要になったインポートを削除
import { isGroupingBySize } from './GroupSettings.js';

'use strict';

// シャッフル関数（フィッシャー・イェーツのシャッフル）
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;   // シャッフル後の配列を返す
}

// 出席（予定）者を【present===1】でフィルタリングして当日の出席者を返す関数
export function createPresentCorporateGroups() {
    const presentCorporateGroups = new Map();
    corporateGroups.forEach((corporateAttendees, corporateName) => { // 法人ごとに処理
        const filteredGroup = corporateAttendees.filter(attendee => attendee.present === 1);
        if (filteredGroup.length > 0) {
            presentCorporateGroups.set(corporateName, filteredGroup);
        }
    });
    return presentCorporateGroups;
}

// グループ数を計算する関数
export function calculateNumGroups(presentCorporateGroups) {
    const totalAttendees = Array.from(presentCorporateGroups.values()).flat().length;   
    // console.log('calculateNumGroups:GROUP_SIZE:', getGroupSize());
    setNumGroups(Math.ceil(totalAttendees / getGroupSize()));   // グループ数を割り出す（小数点切り上げ）
    // console.log('calculateNumGroups:num_groups:', getNumGroups());
    if (isErrorNumGroups()) {
        console.error('Error: isErrorNumGroups() === true. Cannot assign groups.');
        alert('グループ分けできません。出席者がいないか、１グループあたりの人数が大きすぎます。');
        return false;
    }
    return true;
}

// グループあたりの人数を計算する関数
function calculateGroupSize(presentCorporateGroups) {
    const totalAttendees = Array.from(presentCorporateGroups.values()).flat().length;   // 出席者の総数
    // console.log('calculateGroupSize:num_groups:', getNumGroups());
    setGroupSize(Math.ceil(totalAttendees / getNumGroups()));   // グループあたりの人数を割り出す（小数点切り上げ）
    // console.log('calculateGroupSize:GROUP_SIZE:', getGroupSize());
    if (getGroupSize() <= 0) {
        console.error('Error: getGroupSize() <= 0. Cannot assign groups.');
        alert('グループ分けできません。グループ数が多すぎます。');
        return false;
    }
    return true;
}

// グループ分けボタンがクリックされたときの処理
export function handleGroupAssignment() {
    // console.log('handleGroupAssignment called', corporateGroups);

    const presentCorporateGroups = createPresentCorporateGroups();
    if (isGroupingBySize()) {   // ラジオボタンが「グループ人数」の場合
        if (!calculateNumGroups(presentCorporateGroups)) {  // グループ数を計算
            return;
        }
    } else {                    // ラジオボタンが「グループ数」の場合
        if (!calculateGroupSize(presentCorporateGroups)) {  // グループあたりの人数を計算
            return; 
        }
    }

    // グループ分けを実行
    const { assignments, previousMembers } = assignBalancedGroups(presentCorporateGroups);
    // console.log('balancedGroupAssignments:', assignments);
    // グループ分け結果を表示
    displayResultsModal(assignments, previousMembers);
}

// 出席者のグループ分けを実行する関数
export function assignBalancedGroups(presentCorporateGroups) {
    // console.log('assignBalancedGroups called', presentCorporateGroups);
    // console.log('num_groups:', getNumGroups());

    if (isErrorNumGroups()) {
        throw new Error('num_groups is 0. これじゃグループ分けができないよ！');
    }

    const assignments = []; // グループ分けの結果を格納する配列
    // 各出席者が過去に同じグループに入った出席者を記録するマップ
    const previousMembers = new Map();

    // 法人ごとの出席者リストを配列化して、操作しやすくする
    const corporateGroupsArray = Array.from(presentCorporateGroups.values());

    // 指定されたラウンド数だけグループ分けを行う
    for (let round = 0; round < getRoundSize(); round++) {
        // groups（配列）をnum_groups個の空の配列で初期化する
        let groups = Array.from({ length: getNumGroups() }, () => []);
        // console.log('groups:', groups);

        // 法人ごとの出席者リストをシャッフルしてランダムな順序にする
        corporateGroupsArray.forEach(group => shuffle(group));
        // console.log('corporateGroupsArray:', corporateGroupsArray);

        // 各法人ごとにグループに割り当てる
        let groupIndex = 0; // グループのインデックスを初期化（法人ごとに初期化されないように外に出す）
        corporateGroupsArray.forEach(corporate => {
            // console.log('assigned corporate:', corporate);
            let attempts = 0; // attempts 変数を宣言
            corporate.forEach(attendee => {
                // 過去に同じグループに入った出席者を避ける
                // console.log(`Checking attendee: ${attendee.name}`);
                // console.log(`previousMembers.get(${attendee.name}):`, previousMembers.get(attendee.name));
                if (previousMembers.get(attendee.name)) {
                    // console.log(`previousMembers.get(${attendee.name}).some(member => groups[groupIndex].includes(member)):`,
                        previousMembers.get(attendee.name).some(member => groups[groupIndex].includes(member));
                }
            
                while (previousMembers.get(attendee.name)
                    && previousMembers.get(attendee.name).some(member => groups[groupIndex].includes(member))) {
                    groupIndex = (groupIndex + 1) % getNumGroups(); // 次のグループに移動
                    // console.log(`groupIndex:${groupIndex} attempts:${attempts}`);
                    attempts++;
                    if (attempts >= getNumGroups()) {
                        // console.log(`Breaking out of loop to avoid infinite loop for attendee: ${attendee.name}`);
                        break; // 無限ループを回避するためにループを抜ける
                    }
                }
                groups[groupIndex].push(attendee);  // 出席者をグループに追加
                groupIndex = (groupIndex + 1) % getNumGroups(); // 次のグループに移動
            });
        });
        // console.log('groups before balancing:', groups);

        // 同じグループに入った出席者を記録
        groups.forEach(group => {
            group.forEach(attendee => {
                if (!previousMembers.has(attendee.name)) { 
                    previousMembers.set(attendee.name, []);
                }
                // 現在のグループのメンバーを追加
                previousMembers.get(attendee.name).push(...group.map(member => member.name));
            });
        });

        // 現在のラウンドのグループ分け結果を assignments に追加
        assignments.push(groups);
        // console.log(`round ${round + 1} `);
        // console.log('assignments:', assignments);
    }

    // console.log('previousMembers:', previousMembers);

    // 全てのラウンドのグループ分け結果と previousMembers を返す
    return { assignments, previousMembers };
}
