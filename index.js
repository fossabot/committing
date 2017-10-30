const chalk = require('chalk');

console.info(`process ${chalk.blue(process.pid)} ${chalk.green('start')}.`);

process.on('SIGINT', () => {
  console.info(`SIGINT received`);
  process.exit(1);
});

process.on('exit', () => {
  console.info(`process ${chalk.blue(process.pid)} ${chalk.red('exit')}.`);
});

process.on('uncaughtException', err => {
  console.error('Error caught in uncaughtException event:');
  console.error(err);
});

process.on('unhandledRejection', (reason, p) => {
  console.error('Unhandled Rejection at:', p, 'reason:', reason);
});

const fs = require('fs-extra');
const _ = require('lodash');
const moment = require('moment');
const git = require('simple-git')(__dirname);
const schedule = require('node-schedule');
const emoji = require('./emojis.json');
const emojiKeys = Object.keys(emoji);

const META_FILE_PATH = './meta.json';

/**
 * get random emoji char
 * @returns {*}
 */
function getEmoji() {
  const index = _.random(0, emojiKeys.length);
  const key = emojiKeys[index];
  const entity = emoji[key];
  if (!entity.char) {
    return getEmoji();
  } else {
    return entity.char;
  }
}

/*
* commit the project
* */
async function commit() {
  const meta = await fs.readJson(META_FILE_PATH, { encoding: 'utf8' });

  await new Promise((resolve, reject) => {
    git.pull((err, update) => {
      err ? reject(err) : resolve(update);
    });
  });

  meta.times = meta.times + 1;
  meta.updatedAt = new Date();

  await fs.writeJson(META_FILE_PATH, meta, { encoding: 'utf8' });

  await new Promise((resolve, reject) => {
    git
      .add('./')
      .commit(
        `[${moment(meta.updatedAt).format(
          `YYYY-MM-DD HH:mm:ss`
        )}] ${meta.times}th commit ${getEmoji()}`
      )
      .push((err, data) => {
        err ? reject(err) : resolve(data);
      });
  });
}

// 没隔1小时commit一次
// 不过分吧？
schedule.scheduleJob('0 0 */1 * * *', function() {
  commit()
    .then(() => {
      console.info(`Commit success`);
    })
    .catch(err => {
      console.error(err);
    });
});
