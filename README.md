# committttttttttttttttttttttting

每天定时commit，保持commit连击不间断...

### 使用

因为push需要验证，所以要么指定github的账号密码，要么使用ssh

有三种方式:

自己fork项目

1. 指定账号密码clone项目

```bash
git clone https:username:password@github.com/username/committttttttttttttttttttttting
cd committttttttttttttttttttttting
pm2 start pm2.json
```

2. 使用ssh克隆项目
```bash
git clone git@github.com:username/committttttttttttttttttttttting.git
cd committttttttttttttttttttttting
pm2 start pm2.json
```

3. 修改``.git/config``文件

主要修改``[remote "origin"] > url``字段，是的url带有``username``和``password``

···
[core]
        repositoryformatversion = 0
        filemode = true
        bare = false
        logallrefupdates = true
[remote "origin"]
        url = https://username:password@github.com/axetroy/committttttttttttttttttttttting.git
        fetch = +refs/heads/*:refs/remotes/origin/*
[branch "master"]
        remote = origin
        merge = refs/heads/master
```
