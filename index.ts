import dotenv from 'dotenv';
import FileSync from 'lowdb/adapters/FileSync'
import low from 'lowdb';
import { from, of, timer } from 'rxjs';
import { delay, filter, mergeMap, retryWhen, switchMap, take, tap } from 'rxjs/operators';
import { isNotAlreadyChecked, isValidCheckTime, updateCheckedDate } from './utils/utils';
import { User } from './models/Database';
import { coronaCheckEpic } from './epics/coronaCheckEpic';
import { Browser } from 'puppeteer';

const TEN_MINUTES = 1000 * 60 * 10

dotenv.config();

const adapter = new FileSync('db.json')
const db = low(adapter)

timer(0, TEN_MINUTES).pipe(
  filter(isValidCheckTime),
  switchMap(() => {
    const users: Array<User> = db.get('users').value();
    return from(users)
  }),
  filter(isNotAlreadyChecked),
  mergeMap(user => of(1).pipe(coronaCheckEpic(user)), 10),
  tap(({ user }) => updateCheckedDate(db, user)),
  tap(({ browser, user }: { browser: Browser, user: User }) => {
    browser.close()
  }),
  retryWhen(error$ => {
    return error$.pipe(delay(TEN_MINUTES), take(100))
  })
).subscribe(() => {
  /**TODO: notify successful check*/
}, () => {
  /**TODO: notify failed check*/
  throw Error(`Let PM2 restart`)
})
