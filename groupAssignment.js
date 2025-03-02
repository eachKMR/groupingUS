import { COLUMN_CORPORATE_NAME, COLUMN_DEPARTMENT, COLUMN_NAME, COLUMN_FURIGANA, COLUMN_PRESENT,
    FURIGANA_INITIALS,
     } from './shareData.js'; 

import { renderGroupResults, displayResultsModal } from './renderGroupResults.js';
import { setCountOfAttendees } from './shareData.js';
import { isGroupingBySize,getGroupSize, setGroupSize, getAdjustedMinGroupSize,
    corporateGroups,
    clearCorporateGroups, setCorporateGroup, 
    setNumGroups,
    getNumGroups,
    isErrorNumGroups,
    updateGroupSettings,
    getRoundSize, } from './GroupSettings.js';

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
    let totalAttendees = 0; // 出席者の総数を保持する変数を追加

    corporateGroups.forEach((corporateAttendees, corporateName) => { // 法人ごとに処理
        const filteredGroup = corporateAttendees.filter(attendee => attendee.present === 1);
        if (filteredGroup.length > 0) {
            presentCorporateGroups.set(corporateName, filteredGroup);
            totalAttendees += filteredGroup.length; // 出席者の総数を更新
        }
    });

    setCountOfAttendees(totalAttendees); // 出席者の総数を設定
    return presentCorporateGroups;
}

// グループ分けボタンがクリックされたときの処理
export function handleGroupAssignment() {
    const presentCorporateGroups = createPresentCorporateGroups();
    updateGroupSettings();  // グループ分け基準の設定を更新

    // グループ分けを実行
    const { assignments, previousMembers } = assignBalancedGroups(presentCorporateGroups);
    // グループ分け結果を表示
    displayResultsModal(assignments, previousMembers);
}

// 出席者のグループ分けを実行する関数
export function assignBalancedGroups(presentCorporateGroups) {
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

        // 法人ごとの出席者リストをシャッフルしてランダムな順序にする
        corporateGroupsArray.forEach(group => shuffle(group));
        console.log('corporateGroupsArray:', corporateGroupsArray);

        // 各法人ごとにグループに割り当てる
        let groupIndex = 0; // グループのインデックスを初期化（法人ごとに初期化されないように外に出す）
        corporateGroupsArray.forEach(corporate => {
            corporate.forEach(attendee => {
                let attempts = 0; // attempts 変数を初期化
                const maxAttempts = getNumGroups() * 2; // 最大試行回数を設定

                // 第1回のラウンドに限り、firstGroup属性が設定されている出席者を優先的に割り当てる
                if (round === 0 && Number.isInteger(attendee.firstGroup)
                     && attendee.firstGroup > 0 && attendee.firstGroup <= getNumGroups()) {
                    groupIndex = attendee.firstGroup - 1;
                } else {
                    // 過去に同じグループに入った出席者を避ける
                    const previousGroupMembers = previousMembers.get(attendee.name) || [];
                    while ((previousGroupMembers.some(member => groups[groupIndex].some(g => g.name === member))
                         || groups[groupIndex].length >= getGroupSize()) && attempts < maxAttempts) {
                        groupIndex = (groupIndex + 1) % getNumGroups(); // シーケンシャルに次のグループに移動
                        attempts++;
                    }

                    // 最後のチェック：グループの人数が getGroupSize() を超えないようにする
                    if (groups[groupIndex].length >= getGroupSize()) {
                        let foundGroup = false;
                        for (let i = 0; i < getNumGroups(); i++) {
                            if (groups[i].length < getGroupSize()) {
                                groupIndex = i;
                                foundGroup = true;
                                break;
                            }
                        }
                        if (!foundGroup) {
                            console.error(`No available group found for ${attendee.name}. This should not happen.`);
                        }
                    }
                }

                groups[groupIndex].push(attendee);  // 出席者をグループに追加
                groupIndex = (groupIndex + 1) % getNumGroups(); // 次のグループに移動
            });
        });

        // グループの人数が getAdjustedMinGroupSize() を下回らないように調整
        groups.forEach((group, index) => {
            // グループの人数が getAdjustedMinGroupSize() を下回らないように調整
            while (group.length < getAdjustedMinGroupSize()) {
                // 他のグループからメンバーを移動
                for (let i = 0; i < getNumGroups(); i++) {
                    if (i !== index && groups[i].length > getAdjustedMinGroupSize()) {
                        group.push(groups[i].pop());
                        break;
                    }
                }
            }

            // グループの人数が getGroupSize() を上回らないように調整
            while (group.length > getGroupSize()) {
                // 他のグループにメンバーを移動
                for (let i = 0; i < getNumGroups(); i++) {
                    if (i !== index && groups[i].length < getGroupSize()) {
                        groups[i].push(group.pop());
                        break;
                    }
                }
            }
        });

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
    }

    // 全てのラウンドのグループ分け結果と previousMembers を返す
    return { assignments, previousMembers };
}
