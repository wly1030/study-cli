const path = require("path");
const fs = require("fs-extra");
const Inquirer = require("inquirer"); // 交互
const loading = require('./loading.js');
const { getZhuRongRepo, getTagsByRepo} = require("./api.js")
const downloadGitRepo = require('download-git-repo'); // 从git下载代码
const util = require("util");
const chalk = require("chalk") // 给打印文字增加颜色

// 获取模板信息及用户最终选择的模板
async function getRepoInfo() {
  // 获取组织下的仓库信息
  let repoList = await loading('拉取模板中',getZhuRongRepo)
  // 提取仓库名
  const repos = repoList.map((item) => item.name);
  // 选取模板信息
  let { repo } = await new Inquirer.prompt([
    {
      name: "repo",
      type: "list",
      message: "Please choose a template",
      choices: repos,
    },
  ]);
  return repo;
}
// 获取版本信息及用户选择的版本
async function getTagInfo(repo) {
  let tagList = await loading('拉取模板中',getTagsByRepo, repo)
  const tags = tagList.map((item) => item.name);
  // 选取模板信息
  let { tag } = await new Inquirer.prompt([
    {
      name: "tag",
      type: "list",
      message: "Please choose a version",
      choices: tags,
    },
  ]);
  return tag;
}
async function download(templateUrl,projectName) {
  // 调用 downloadGitRepo 方法将对应模板下载到指定目录
  await loading(
    "downloading template, please wait",
    util.promisify(downloadGitRepo),
    templateUrl,
    path.join(process.cwd(), projectName) // 项目创建位置
  );
}
async function selectProject(projectName, options) {
  const { name } = await new Inquirer.prompt([
    {
      name: "name",
      type: "list",
      message: "Please choose a template",
      choices: [
        {name:'vue2',value:'vue2'},
        {name:'vue3',value:'vue3'},
        {name:'koa2',value:'koa2'},
        {name:'koa2_study_dome',value:'koa2_study_dome'}
      ],
    },
  ])
  return name
}

module.exports =  async (projectName, options) => {
  // 获取当前工作目录
  const cwd = process.cwd();
  console.log('cwd',cwd);
  // 拼接得到项目目录
  const targetDirectory = path.join(cwd, projectName);
  console.log('targetDirectory',targetDirectory);
  // 判断目录是否存在
  if (fs.existsSync(targetDirectory)) {
    // 判断是否使用了 --force参数
    if (options.force) {
      await fs.remove(targetDirectory);
    }else{
      let { isOver } = await new Inquirer.prompt([
        // 返回promise
        {
          name:'isOver',
          type:'list',
          message:`${projectName}已经存在，是否覆盖？`,
          choices:[{
            name:'覆盖',
            value:true
          },{
            name:'不覆盖',
            value:false
          }]
        }
      ])
      if (isOver) {
        // 先删除掉原有重名目录
        await fs.remove(targetDirectory);
      }else{
        return
      }
    }
  }
  // const repo = await getRepoInfo()
  // console.log('repo',repo);
  // const tag = await getTagInfo(repo)
  // console.log('tag',tag);
  const name = await selectProject()
  const urlMap = {
    vue2:'PanJiaChen/vue-element-admin',
    vue3:'HalseySpicy/Geeker-Admin',
    koa2_study_dome:'chenshenhai/koa2-note',
    koa2:'Rain120/qq-music-api'
  }
  await download(urlMap[name],projectName)
  // 模板使用提示
  console.log(`\r\nSuccessfully created project ${chalk.cyan(projectName)}`);
  // console.log(`\r\n  cd ${chalk.cyan(projectName)}`);
  // console.log("  npm install\r\n");
  // console.log("  npm run dev\r\n")
}