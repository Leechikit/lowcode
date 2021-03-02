// 从页面配置中获取当前环境变量
const env = window.ENV

const config = {
  dev: `hetu-plugin`,
  test: `hetu-plugin`,
  prod: `hetu-plugin`
}

export function getDefaultSubmodule() {
  return config[env] || 'hetu-plugin'
}
