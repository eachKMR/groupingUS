import { corporateGroups } from './shareData.js';

// 偶数文字目を '●' に置き換える関数
function maskName(name) {
    return name.split('').map((char, index) => (index % 2 === 1 ? '●' : char)).join('');
}

// グループ分けの結果を保存する関数
export function saveGroupResult(groupAssignments) {
    console.log('Saving group assignments:', groupAssignments);

    const workbook = XLSX.utils.book_new();
    const worksheetData1 = [];
    const worksheetData2 = [];

    // 罫線のスタイルを定義
    const borderStyle = {
        top: { style: 'thin' },
        bottom: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' }
    };

    // Sheet1: グループごとの出席者リスト
    groupAssignments.forEach((assignment, round) => {
        worksheetData1.push([`グループ分け第${round + 1}回`]);
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
                attendeeMap.get(key).groups[round] = `Grp ${index + 1}`;
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

    // 罫線を追加
    const range = XLSX.utils.decode_range(worksheet2['!ref']);
    for (let R = range.s.r; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
            const cell_address = { c: C, r: R };
            const cell_ref = XLSX.utils.encode_cell(cell_address);
            if (!worksheet2[cell_ref]) worksheet2[cell_ref] = { t: 's', v: '' };
            worksheet2[cell_ref].s = { border: borderStyle };
        }
    }

    // 列幅を自動調整
    const colWidths = worksheetData2[0].map((_, colIndex) => {
        return Math.max(...worksheetData2.map(row => (row[colIndex] ? row[colIndex].toString().length : 0)));
    });
    worksheet2['!cols'] = colWidths.map(width => ({ wch: width }));

    XLSX.utils.book_append_sheet(workbook, worksheet2, 'Sheet2');

    // ファイルを保存
    XLSX.writeFile(workbook, 'グループ分け.xlsx');
    console.log('File saved to グループ分け.xlsx');
}