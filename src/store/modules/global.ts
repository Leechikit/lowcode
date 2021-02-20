import _ from 'lodash'
import Api from '@/apis'
import { post as axiosPost } from '@/utils/request'

import { IGlobalState, IPaneItem } from '@/types/models/global'

const feedbackSubmit = (params: dynamicObject) => {
  return axiosPost('/api/hetu/feedback/add', params)
}

function isPaneItem(obj: any) {
  if (_.isPlainObject(obj)) {
    const { key, title, closable, content } = obj
    if (_.isString(key) && _.isString(title) && _.isBoolean(closable)) {
      return true
    }
  }

  return false
}

export default {
  namespaced: true,
  state: {
    // 项目列表
    projectList: null,
    // 项目详情
    projectDetail: null,
    // 页面配置
    pageConfig: null,
    // 用户信息
    userInfo: null,
    // 页面是否初始化
    isPageInit: false,
    // 菜单栏数据
    menuData: null,
    // 项目id
    projectId: null,
    // 草稿Id
    draftId: null,
    // 创建人Id
    createUcid: null,
    // 是否为本地页面
    isLocalPage: false,
    // 面包屑
    panes: [],
    // 激活的面包屑
    activePanekey: ''
  },
  mutations: {
    setState(state: IGlobalState, payload: IGlobalState) {
      if (!_.isPlainObject(payload)) {
        throw new TypeError(`payload:${payload} must be an plain object`)
      }
      state = {
        ...state,
        ...payload
      }
    },
    addPane(state: IGlobalState, payload: IPaneItem[]) {
      if (!isPaneItem(payload)) {
        throw new TypeError(`payload:${payload} is not an IPaneItem`)
      }
      const isExist = state.panes.some(v => v.key === payload.key)
      if (isExist) return

      state.panes = [...state.panes, ...payload]
    }
  },
  actions: {
    // 获取用户信息
    async getAsyncUserInfo({ commit }) {
      const userInfo = await Api.User.getAsyncUserInfo()
      if (!_.get(userInfo, 'id')) {
        return Promise.reject(
          'getAsyncUserInfo 响应格式错误:' + JSON.stringify(userInfo)
        )
      }

      commit('setState', { userInfo })

      return Promise.resolve(userInfo)
    },

    // 获取项目列表
    async getAsyncProjectList({ commit }) {
      const projectList = await Api.Project.getAsyncProjectList()

      commit('setState', { projectList })

      return Promise.resolve(projectList)
    },

    // 通过page path获取项目详情
    async getAsyncProjectDetail({ commit }, payload: object) {
      const pathname = _.get(payload, 'pathname')
      if (!pathname) {
        throw new TypeError('getAsyncProjectDetail 必须传递pathname 参数 ')
      }
      const projectDetail = await Api.Project.getAsyncProjectDetail(pathname)

      commit('setState', { projectDetail })

      return Promise.resolve(projectDetail)
    },

    // 根据project id获取项目详情
    async getAsyncProjectDetailById({ commit }, payload) {
      const projectId = _.get(payload, 'projectId')
      if (!projectId) {
        throw new TypeError('getAsyncProjectDetailById 必须传递projectId参数 ')
      }
      const projectDetail = await Api.Project.getAsyncProjectDetailById(
        projectId
      )

      commit('setState', { projectDetail })

      return Promise.resolve(projectDetail)
    },

    // 获取页面详情
    async getAsyncPageDetail({ commit }, payload) {
      const pathname = _.get(payload, 'pathname')
      if (!pathname) {
        throw new TypeError('getAsyncPageDetail 必须传递pathname 参数 ')
      }
      const result = await Api.Page.getAsyncPageDetail(pathname)

      if (!_.get(result, 'pageConfig.route')) {
        throw new TypeError(
          'getAsyncPageDetail 响应格式错误:' + JSON.stringify(result.pageConfig)
        )
      }
      commit('setState', result)

      return Promise.resolve(result)
    },

    // 获取菜单详情
    async getAsyncMenuData({ commit }, payload) {
      let menuData = []
      const config = _.get(payload, 'config')

      // 如果为数组
      if (_.isArray(config)) {
        menuData = config
      }

      const urlReg = /^(https?:\/\/)?(([a-zA-Z0-9_-])+(\.)?)*(:\d+)?(\/((\.)?(\?)?=?&?[a-zA-Z0-9_-](\?)?)*)*$/i
      // 如果为url
      if (_.isString(config) && urlReg.test(config)) {
        menuData = await Api.Project.getAsyncMenuData(config)

        if (!_.isArray(menuData)) {
          throw new TypeError('getAsyncMenuData 请求响应值不合法:' + menuData)
        }
      }

      commit('setState', { menuData })

      return Promise.resolve(menuData)
    },
    async feedbackSubmit({ commit }, payload) {
      const res = await feedbackSubmit({ ...payload })

      commit('setState', { res })
      return res
    }
  }
}
