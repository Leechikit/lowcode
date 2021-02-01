import _ from 'lodash'
import Axios from 'axios'

function getResouceType(url: string) {
  const jsReg = /\.js$/
  const cssReg = /\.css$/
  if (jsReg.test(url)) return 'javascript'

  if (cssReg.test(url)) return 'css'

  return undefined
}

function loadJS(url: string, submodule: string) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.setAttribute('hetustark', 'dynamic')
    script.setAttribute('submodule', submodule)
    script.type = 'text/javascript'
    script.crossOrigin = 'anonymous'
    script.src = url
    script.async = true
    script.onload = function() {
      resolve()
    }
    script.onerror = function() {
      reject()
    }

    document.head.appendChild(script)
  })
}

function loadCSS(url: string, submodule: string) {
  return new Promise((resolve, reject) => {
    const link = document.createElement('link')
    link.setAttribute('hetustark', 'dynamic')
    link.setAttribute('submodule', submodule)
    link.rel = 'stylesheet'
    link.type = 'text/css'
    link.href = url
    link.onload = function() {
      resolve()
    }
    link.onerror = function() {
      reject()
    }
    document.head.appendChild(link)
  })
}

export async function parseResourceUrl(url: string) {
  return await Axios({
    url,
    params: {
      time: new Date().getTime()
    }
  })
}

/**
 * 卸载资源
 * @param url
 */
export async function uninstallCDNResource(submodule: string) {
  const nodes: NodeListOf<HTMLElement> = document.querySelectorAll(
    `script[hetustark='dynamic'],link[hetustark='dynamic']`
  )
  for (const v of Array.from(nodes)) {
    if (v.getAttribute('submodule') !== submodule) {
      const parent = v.parentElement
      parent && parent.removeChild(v)
    }
  }
}

/**
 * 动态加载cdn资源
 * @param data
 */
export async function initCDNResource(submodule: string) {
  let publicPath = `${window.location.origin}/${submodule}`

  if (process.env.NODE_ENV === 'development') {
    // zyyrabbit
    publicPath = window.location.origin
  }

  // publicPath.replace('//', '/')

  // 获取manifest.json
  const manifestJson = await parseResourceUrl(`${publicPath}/manifest.json`)

  // 入口文件
  const entrypoints = _.get(manifestJson, ['data', 'entrypoints'])
  // 文件map
  const files = _.get(manifestJson, ['data', 'files'])

  if (!_.isArray(entrypoints)) {
    throw new Error(`组件库${submodule}加载失败`)
  }

  const promises = []

  for (const item of entrypoints) {
    const file = _.get(files, item)
    const resourceURL = `${publicPath}/${file}`

    const type = getResouceType(resourceURL)
    switch (type) {
      case 'javascript':
        promises.push(loadJS(resourceURL, submodule))
        break
      case 'css':
        promises.push(loadCSS(resourceURL, submodule))
        break
      default:
        continue
    }
  }

  await Promise.all(promises)

  // 卸载资源
  uninstallCDNResource(submodule)

  return true
}

export async function initSubmodules(submodules: string) {
  if (_.isString(submodules)) {
    const _submodules = submodules.split(',')
    for (const submodule of _submodules) {
      submodule && (await initCDNResource(submodule))
    }
    /* 
    let use = getHetu('use')
    if (!_.isFunction(use)) {
      throw new Error(`河图插件注入失败`)
    }
    // 注册antd组件
    use(_antdComponents, '') */
  }
}
