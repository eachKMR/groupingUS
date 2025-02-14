import { setGroupSize, setNumGroups } from './shareData.js';

'use strict';

export function updateGroupSettings(selectedValue, selectedOption) {
    if (selectedOption === 'size') {
        setGroupSize(selectedValue);
        setNumGroups(0);
        console.log('GROUP_SIZE updated to:', selectedValue);
    } else if (selectedOption === 'count') {
        setNumGroups(selectedValue);
        setGroupSize(0);
        console.log('num_groups updated to:', selectedValue);
    }
}

// グループ分けの基準を判定する関数
export function isGroupingBySize() {
  const groupOption = document.querySelector('input[name="group-option"]:checked');
  return groupOption && groupOption.value === 'size';
}
