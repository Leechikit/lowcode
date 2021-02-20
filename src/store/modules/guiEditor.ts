/* eslint-disable no-useless-catch */
import { set, get, isPlainObject } from 'lodash'
import { changeIframePageConfig } from '@/utils/utils'
import { post as axiosPost, get as axiosGet } from '@/utils/request'

// import localHistory from '@/utils/localHistory'

import queryString from 'query-string'

import { guiEditorState } from '@/types/models/guiEditor'

// 创建页面
const createPage = (params: dynamicObject) => {
  const querys = location.search.replace('?', '').split('&')
  const query: dynamicObject = {}
  querys.map(v => {
    const d = v.split('=')
    query[d[0]] = d[1]
  })
  query['id'] && (params['projectId'] = query['id'])
  return axiosPost('/api/page/record/create', params)
}

// 更新页面配置
const updatePageConfig = params => {
  return axiosPost('/api/page/draft/save', params)
}

// 获取页面配置
const getPageConfig = params => {
  return axiosGet('/api/page/draft/get', params)
}

// 切换iframe loading状态
const toggleIframeLoading = (v: boolean, commit: Function) => {
  return commit('setState', { isIframeLoading: !!v })
}

let project = null

export default {
  namespaced: true,
  state: {
    // iframe 查询参数
    query: null,
    // 页面id
    pageId: null,
    // 草稿id
    draftId: null,
    // 项目id
    project: null,
    // 页面配置
    pageConfig: null,
    // 编译结果
    pagestate: null,
    // 页面模式
    hoverComponentData: null,
    selectedComponentData: null,
    isIframeLoading: false,
    // 是否展示占位符元素(用于添加组件)
    isInsertItemMode: false,
    // 是否处于拖拽状态
    isDragging: false,
    // 右侧激活面板,默认为可视化编辑器
    activeTab: 'base',
    // 是否锁屏
    isLockIframe: true
  },
  mutations: {
    setState(state: guiEditorState, payload: guiEditorState) {
      if (!isPlainObject(payload)) {
        throw new TypeError('payload must be an plain object')
      }
      Object.keys(payload).forEach(key => {
        if (key) {
          state[key] = payload[key]
        }
      })
    }
  },
  actions: {
    /**
     * 插入新组件, 显示占位组件, 开始选择需要插入的组件
     */
    async startInsertItemMode({ commit }) {
      commit('setState', { isInsertItemMode: true })
    },
    /**
     * 组件插入完毕, 隐藏占位组件
     */
    async finishInsertItemMode({ commit }) {
      commit('setState', { isInsertItemMode: false })
    },
    // 更新页面配置, 更新iframe
    async updatePageConfigAndIframe({ commit }, payload) {
      try {
        toggleIframeLoading(true, commit)
        const { key, value, pageConfig } = payload
        let result = value
        if (key) {
          result = set(pageConfig, key, result)
        }

        const { route, query } = queryString.parse(window.location.search)

        if (result.route !== route) {
          const searchStr = queryString.stringify({
            route: result.route,
            query
          })
          window.location.href = window.location.pathname + '?' + searchStr
          return false
        }

        result = JSON.parse(JSON.stringify(result))
        await changeIframePageConfig(result)

        commit('setState', { pageConfig: result })
        return
      } catch (e) {
        throw e
      } finally {
        toggleIframeLoading(false, commit)
      }
    },
    // 获取页面配置
    async getPageConfig({ commit }, payload) {
      try {
        toggleIframeLoading(true, commit)
        const res = await getPageConfig(payload)
        if (get(res, 'data.draft.content')) {
          const pageConfig = JSON.parse(get(res, 'data.draft.content'))
          const pageId = get(res, 'data.page.id')
          const draftId = get(res, 'data.draft.id')
          project = get(res, 'data.page.project_id')

          // localHistory.init({ pageId })

          // localHistory.push(pageConfig)
          commit('setState', {
            pageConfig,
            pageId,
            draftId,
            project
          })
          return pageConfig
        }
        throw TypeError('接口返回值格式错误' + JSON.stringify(res, null, 2))
      } catch (e) {
        throw e
      } finally {
        toggleIframeLoading(false, commit)
      }
    },
    // 新建页面
    async createPage({ commit }, payload) {
      try {
        if (isPlainObject(payload) && isPlainObject(payload.pageConfig)) {
          const path = get(payload, 'pageConfig.route')
          const name = get(payload, 'pageConfig.title')
          const content = JSON.stringify(payload.pageConfig)

          const { id = -1 } = queryString.parse(window.location.search)

          const res = await createPage({
            path,
            name,
            content,
            projectId: id
          })
          return res
        }
        throw new TypeError('payload must be an plain object')
      } catch (e) {
        throw e
      } finally {
        toggleIframeLoading(false, commit)
      }
    },
    // 更新页面
    async updatePage({ commit }, payload) {
      try {
        toggleIframeLoading(true, commit)
        const { projectId, pageId, pageConfig } = payload

        if (!projectId) {
          throw new TypeError('缺少项目id')
        }
        if (!pageId) {
          throw new TypeError('缺少页面id')
        }
        if (isPlainObject(pageConfig)) {
          const json = JSON.stringify(pageConfig)
          const res = await updatePageConfig({
            projectId,
            pageId,
            content: json
          })

          // localHistory.push(pageConfig)

          const draftId = get(res, 'data.draftId')

          commit('setState', {
            pageConfig,
            pageId,
            draftId
          })
          return res
        }
        throw new TypeError('pageConfig 格式错误')
      } catch (e) {
        throw e
      } finally {
        toggleIframeLoading(false, commit)
      }
    },
    // 发布配置到某环境
    // async publish({ commit }, payload) {
    //   try {
    //   } catch (e) {
    //     throw e
    //   }
    // }
  }
}
