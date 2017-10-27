const simpleGit = require('simple-git')(__dirname);

simpleGit.commit(`hello world`, (err, a, b) => {
  console.log(err, a, b);
  if (err) {
    console.error(err);
  } else {
    console.log(`commit`);
  }
});
