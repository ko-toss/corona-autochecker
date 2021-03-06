import { format, getDay, getHours, getMinutes } from "date-fns";
import { LowDb, User } from '../models/Database';

export function randomHumanDelay({ maxMs, minMs }: { maxMs: number; minMs: number } = { minMs: 600, maxMs: 2000 }) {
  return Math.round(Math.random() * (maxMs - minMs) + minMs)
}

export function isValidCheckTime() {
  const date = new Date();
  const hours = getHours(date);
  const day = getDay(date);
  return !(day === 0 || day === 6 || hours >= 8 || hours < 1);
}

export function isNotAlreadyChecked(user: User) {
  const date = new Date();
  const dateStr = format(date, 'yyyy-MM-dd');
  const checkedDate = user.checkedDate ?? {};
  return !checkedDate[dateStr];
}

export function updateCheckedDate(db: LowDb, user: User) {
  const date = new Date();
  const dateStr = format(date, 'yyyy-MM-dd');
  const checkedDate = user.checkedDate ?? {};
  checkedDate[dateStr] = true;
  db.get('users')
    .find({ id: user.id })
    .assign({ checkedDate: user.checkedDate })
    .write()
}

