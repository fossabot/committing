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
const path = require('path');
const _ = require('lodash');
const moment = require('moment');
const git = require('simple-git')(__dirname);
const schedule = require('node-schedule');
const gitConfigParser = require('parse-git-config');
const gitUrlParser = require('git-url-parse');
const emoji = require('./emojis.json');
const emojiKeys = Object.keys(emoji);

const cwd = process.cwd();
const META_FILE_PATH = '.committing';

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
async function commit(targetPath, date) {
  await fs.ensureFile(path.join(targetPath, META_FILE_PATH));

  let meta = {};

  try {
    meta = await fs.readJson(META_FILE_PATH, { encoding: 'utf8' });
  } catch (err) {
    console.error(err);
  }

  await new Promise((resolve, reject) => {
    git.pull((err, update) => {
      err ? reject(err) : resolve(update);
    });
  });

  meta.times = (meta.times || 0) + 1;
  meta.updatedAt = date;

  await fs.writeJson(META_FILE_PATH, meta, {
    spaces: 2,
    replacer: null,
    encoding: 'utf8'
  });

  await new Promise((resolve, reject) => {
    git
      .add('./')
      .commit(
        `[${moment(meta.updatedAt).format(
          `YYYY-MM-DD HH:mm:ss`
        )}] ${meta.times}th ${getEmoji()}`
      )
      .push((err, data) => {
        err ? reject(err) : resolve(data);
      });
  });
}

/**
 * check the dir is pushable
 * @param targetPath
 * @returns {boolean}
 */
function checkPushAble(targetPath) {
  // make sure .git dir exist
  try {
    fs.statSync(path.join(targetPath, '.git'));
  } catch (err) {
    console.error(
      `Can not found ${chalk.green('.git')} dir in ${chalk.green(targetPath)}`
    );
    throw err;
  }

  try {
    const result = gitConfigParser.sync({ cwd: targetPath });
    const remote = result['remote "origin"'];
    const configPath = path.join(targetPath, '.git', 'config');
    if (!remote) {
      console.info(`Can not found remote url in ${configPath}`);
      return false;
    }

    const gitUrl = gitUrlParser(remote.url);
    const protocol = gitUrl.protocol;
    const user_pwd = gitUrl.user.split(':');
    const user = user_pwd[0];
    const password = user_pwd[1];

    // http
    if (protocol.indexOf('http') >= 0) {
      // if not set the password
      if (!user && !password) {
        const url = `${protocol}://${chalk.green(
          '{username}@{password}'
        )}${gitUrl.resource + gitUrl.pathname}`;

        console.info(
          `Please check the ${chalk.green(
            configPath
          )} remote url contain the ${chalk.green(
            'username'
          )} and ${chalk.green('password')}`
        );

        console.info(`like this: ${url}`);
        return;
      }
    } else if (protocol !== 'ssh') {
      // check is ssh or not
      console.info(`Not ssh remote url`);
      return false;
    }
  } catch (err) {
    if (err) {
      console.error(err);
    }
    return false;
  }
}

/**
 * main function
 * */
function main(targetPath, rule = '* * */1 * * *') {
  checkPushAble(targetPath);

  // start the job
  schedule.scheduleJob(rule, function() {
    let d = new Date();
    commit(targetPath, d)
      .then(() => {
        console.info(`Commit success`);
        process.chdir(cwd);
      })
      .catch(err => {
        console.error(err);
        process.chdir(cwd);
      });
  });
}

module.exports = main;
