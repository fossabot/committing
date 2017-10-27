process.on('SIGINT', () => {
  console.error(new Error(`Exist sigint`));
  process.exit(1);
});
process.on('exit', function() {
  console.info(`process ${process.pid} exit.`);
});
process.on('uncaughtException', function(err) {
  console.error('Error caught in uncaughtException event:', err);
});

process.on('unhandledRejection', (reason, p) => {
  console.error('Unhandled Rejection at:', p, 'reason:', reason);
});

const fs = require('fs');
const git = require('simple-git')(__dirname);
const schedule = require('node-schedule');
const emoji = require('./emojis.json');
const emojiNumber = Object.keys(emoji).length;

const META_FILE_PATH = './meta.json';

function getEmoji() {
  const index = parseInt(Math.random() * emojiNumber);
  if (!emoji[index]) {
    return getEmoji();
  } else {
    const entity = emoji[index];
    if (!entity.char) {
      return getEmoji();
    } else {
      return entity.char;
    }
  }
}

async function main() {
  const meta = JSON.parse(
    fs.readFileSync(META_FILE_PATH, { encoding: 'utf8' })
  );

  await new Promise((resolve, reject) => {
    git.pull((err, update) => {
      err ? reject(err) : resolve(update);
    });
  });

  meta.times = meta.times + 1;
  meta.updatedAt = new Date();

  fs.writeFileSync(META_FILE_PATH, JSON.stringify(meta, null, 2), {
    encoding: 'utf8'
  });

  await new Promise((resolve, reject) => {
    git
      .add('./')
      .commit(`${meta.times}th commit ${getEmoji()}`)
      .push((err, data) => {
        err ? reject(err) : resolve(data);
      });
  });
}

// schedule.scheduleJob('* */1 * * * *', function() {
schedule.scheduleJob('* * */1 * * *', function() {
  // 每隔1分钟commit一次
  main();
});
