'use strict';

export const scheduledAttendees = []; // 全ての出席予定者データを保持する配列
export function clearScheduledAttendees() { scheduledAttendees.length = 0; }
export function addScheduledAttendee(attendee) { scheduledAttendees.push(attendee); }
export function getScheduledAttendees() { return scheduledAttendees; } // scheduledAttendees配列を取得する関数

// scheduledAttendees配列について各列のインデックス
export const COLUMN_CORPORATE_NAME = 0;
export const COLUMN_DEPARTMENT = 1;
export const COLUMN_NAME = 2;
export const COLUMN_FURIGANA = 3;
export const COLUMN_PRESENT = 4;
export const COLUMN_FIRSTGROUP = 5;

let countOfAttendees = 0; // 出席者の総数
export function getCountOfAttendees() { return countOfAttendees; }
export function setCountOfAttendees(value) { countOfAttendees = value; }

export const FURIGANA_INITIALS = ['ア', 'カ', 'サ', 'タ', 'ナ', 'ハ', 'マ', 'ヤ', 'ラ', 'ワ', 'その他']; // フリガナの初期文字のリスト