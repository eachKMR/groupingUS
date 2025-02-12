'use strict';

export const attendees = []; // 全ての出席者データを保持する配列
export function clearAttendees() { attendees.length = 0; }
export function addAttendee(attendee) { attendees.push(attendee); }

// attendees配列について各列のインデックス
export const COLUMN_CORPORATE_NAME = 0;
export const COLUMN_DEPARTMENT = 1;
export const COLUMN_NAME = 2;
export const COLUMN_FURIGANA = 3;
export const COLUMN_PRESENT = 4;

 // 法人ごとの出席者リストを保持するマップ及び関数の宣言
export const corporateGroups = new Map();
export function clearCorporateGroups() { corporateGroups.clear(); }
export function setCorporateGroup(key, value) { corporateGroups.set(key, value); }

// グループ数関連の変数及び函数の宣言
export let num_groups = 0; // グループ数
export function getNumGroups() { return num_groups; }
export function setNumGroups(value) { num_groups = value; }
export function isErrorNumGroups() { return num_groups === 0; }


export const GROUP_SIZE = 5; // グループのサイズ
export const MIN_GROUP_SIZE = 4; // グループの最小サイズ
export const ROUND_SIZE = 3; // グループ分けのラウンド数

export const FURIGANA_INITIALS = ['ア', 'カ', 'サ', 'タ', 'ナ', 'ハ', 'マ', 'ヤ', 'ラ', 'ワ', 'その他']; // フリガナの初期文字のリスト
