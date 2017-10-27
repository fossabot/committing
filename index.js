const fs = require('fs');
const git = require('simple-git')(__dirname);

const META_FILE_PATH = './meta.json';

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
    git.add('./').commit(`${meta.times}th commit`, (err, data) => {
      err ? reject(err) : resolve(data);
    });
  });
}

main();
