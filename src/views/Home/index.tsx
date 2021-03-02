import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
// import _, { isPlainObject, isFunction, get, cloneDeep } from 'lodash'
import _, { isFunction, cloneDeep, find } from 'lodash'
import queryString from 'query-string'
import Api from '@/apis'

// 引入 npm包
// import Exception403 from '~/components/Exception/403'
// import Exception from '~/components/Exception'
import { Blank } from './Layout'
// import TheModalClone from './ModalClone'

import './index.scss'

// import { getRouterData } from '~/common/router'

// import IconButton from './IconButton'
// import { PageHomeState } from './interface'
import {
  IPageConfig,
  IPaneItem,
  IUserInfo,
  IProjectDetail
} from '@/types/models/global'
import { initSubmodules, getWebType } from '@/utils'
import { routes as routerData } from '@/router'

// const routerData = getRouterData()

// 当前页面的父级页面类型, 可选值有iframe、编辑器、未知
const parentType = getWebType()

let renderEngine: any

@Component
export default class PageHome extends Vue {
  @Prop() history?: string

  private isCloneModalVisible = false
  private isPageInit = false
  private isLocalPage = true
  private errorMessage?: string = null

  private pageConfig?: IPageConfig = {}
  private projectDetail?: IProjectDetail
  private userInfo?: IUserInfo

  private activePanekey?: string
  private panes: IPaneItem[] = []
  private uniqueKey: string = window.location.href

  @Watch('history')
  async onChangeHistory() {
    this.onHistoryChange()
  }

  async created() {
    // const { history } = this.props
    // TODO 改为从html文件获取, 节省时间
    // 获取用户信息
    const userInfo = await Api.User.getAsyncUserInfo()

    const projectDetail = await this.initProject(window.location.pathname)

    this.userInfo = userInfo
    this.projectDetail = projectDetail
    // this.setState({
    //   userInfo,
    //   projectDetail
    // })

    // 编辑器模式
    if (parentType === 'editor') {
      return this.initPageInEditor()
    }

    // 在qiankun微前端中
    if (window.__POWERED_BY_QIANKUN__) {
      await this.initPage(window.location.pathname)
      return
    }

    // 监听history change事件
    this.onHistoryChange()
    // this.unListen = history.listen(async location => {
    //   if (!routerData[location.pathname as keyof typeof routerData]) {
    //     const { pageConfig } = await this.initPage(location.pathname)

    //     const activePanekey = window.location.href.replace(
    //       window.location.origin,
    //       ''
    //     )
    //     const { panes } = this.state
    //     const isExist = panes.some(v => v.key === activePanekey)

    //     this.setState({
    //       activePanekey,
    //       panes: isExist
    //         ? panes
    //         : [
    //             ...this.state.panes,
    //             {
    //               key: activePanekey,
    //               title: pageConfig.title || activePanekey,
    //               closable: true
    //             }
    //           ]
    //     })
    //   }
    // })
  }

  // componentWillUnmount() {
  //   // 取消监听history事件
  //   if (isFunction(this.unListen)) {
  //     this.unListen()
  //   }
  // }

  // unListen?: () => void

  async onHistoryChange() {
    if (!find(routerData, { path: location.pathname })) {
      const { pageConfig } = await this.initPage(location.pathname)

      const activePanekey = window.location.href.replace(
        window.location.origin,
        ''
      )
      const isExist = this.panes.some(v => v.key === activePanekey)

      this.activePanekey = activePanekey
      this.panes = isExist
        ? this.panes
        : [
            ...this.panes,
            {
              key: activePanekey,
              title: pageConfig.title || activePanekey,
              closable: true
            }
          ]
      // this.setState({
      //   activePanekey,
      //   panes: isExist
      //     ? panes
      //     : [
      //         ...this.state.panes,
      //         {
      //           key: activePanekey,
      //           title: pageConfig.title || activePanekey,
      //           closable: true
      //         }
      //       ]
      // })
    }
  }

  /**
   * 在编辑器中,初始化页面
   */
  initPageInEditor() {
    if (window.parent.$$receiveIframeData) {
      this.sendIframeData({
        changePageConfig: this.changePageConfig
      })
    }
  }

  // 向iframe父级页面发送数据
  sendIframeData(data: dynamicObject) {
    if (window.parent.$$receiveIframeData) {
      window.parent.$$receiveIframeData({
        type: 'receiveIframeData',
        data
      })
    }
  }

  // 编辑器, 触发页面更新
  changePageConfig(pageConfig: dynamicObject) {
    return new Promise(resolve => {
      // 保存项目详情和用户信息
      this.pageConfig = { ...pageConfig, uniqueKey: window.location.href }
      this.isPageInit = true
      resolve()
      // this.setState(
      //   {
      //     pageConfig: { ...pageConfig, uniqueKey: window.location.href },
      //     isPageInit: true
      //   },
      //   resolve
      // )
    })
  }

  /**
   * 初始化项目
   */
  async initProject(pathname: string) {
    // 根据页面路径获取项目详情
    const projectDetail = await Api.Project.getAsyncProjectDetail(pathname)

    const submodules = projectDetail.submodules || 'hetu-plugin'

    await initSubmodules(submodules)

    return projectDetail
  }

  /**
   * 初始化页面
   */
  async initPage(pathname: string) {
    try {
      this.isPageInit = false
      // this.setState({
      //   isPageInit: false
      // })

      // 获取页面配置
      const {
        pageConfig,
        projectId,
        isLocalPage
      } = await Api.Page.getAsyncPageDetail()

      // 切换了项目
      if (projectId !== this.projectDetail.id) {
        this.projectDetail = await this.initProject(pathname)
      }

      const _pageConfig = { ...pageConfig, uniqueKey: window.location.href }

      // 保存项目详情和用户信息
      this.errorMessage = null
      this.isPageInit = true
      this.pageConfig = _pageConfig
      this.isLocalPage = isLocalPage
      // this.setState({
      //   errorMessage: null,
      //   isPageInit: true,
      //   projectDetail,
      //   pageConfig: _pageConfig,
      //   isLocalPage
      // })

      return { pageConfig: _pageConfig }
    } catch (e) {
      this.isPageInit = true
      this.errorMessage = e.message || '编译错误'
      // this.setState({
      //   isPageInit: true,
      //   errorMessage: e.message || '编译错误'
      // })
      throw e
    }
  }

  // 获取编辑页面url
  getEditUrl() {
    const route = window.location.pathname
    const { query } = queryString.parseUrl(window.location.href)

    const formateSearch = queryString.stringify({
      route,
      query: queryString.stringify(query)
    })
    return `/guiedit?${formateSearch}`
  }

  // 获取编辑项目url
  getProjectUrl() {
    const projectId = this.projectDetail.id
    return `/projects/detail?projectId=${projectId}`
  }

  onCloneBtnClick() {
    this.isCloneModalVisible = true
    // this.setState({ isCloneModalVisible: true })
  }

  // 渲染layout
  renderLayout(projectDetail: IProjectDetail, children: any) {
    const { history } = this.$props
    let type = _.get(projectDetail, 'layout.type', 'blank')

    // 在编辑器中 || 在iframe中
    if (
      ['editor', 'iframe'].indexOf(parentType) !== -1 ||
      window.__POWERED_BY_QIANKUN__
    ) {
      type = 'blank'
    }

    console.log(type)

    // const basicProps = {
    //   userInfo: this.userInfo,
    //   projectDetail,
    //   activePanekey: this.activePanekey,
    //   panes: this.panes,
    //   history,
    //   onChange: (activePanekey: string, panes: any[]) => {
    //     this.activePanekey = activePanekey
    //     this.panes = panes
    //     // this.setState({
    //     //   activePanekey,
    //     //   panes
    //     // })
    //   }
    // }
    switch (type) {
      case 'blank':
        return <Blank>{children}</Blank>
      case 'basic':
      default:
        // return <Basic {...basicProps}>{children}</Basic>
        return <Blank>{children}</Blank>
    }
  }

  renderContent() {
    // const {
    //   // errorMessage,
    //   pageConfig,
    //   projectDetail,
    //   userInfo
    //   // isPageInit
    // } = this.state

    const { history } = this.$props

    // if (errorMessage) {
    //   return <Exception type="500" desc={errorMessage} />
    // }

    // if (!isPageInit) {
    //   return <Spin size="large" className="g-spin" />
    // }

    if (!_.isPlainObject(this.pageConfig)) {
      return null
    }
    // zyyrabbit

    // let isExit = _.get(window.hetu, 'default')

    // if (!isExit) {
    //   return <Exception type="500" desc="云犀渲染组件加载失败" />
    // }

    const props = {
      ...this.pageConfig,
      history,
      local: {
        ...this.pageConfig.local,
        userInfo: this.userInfo,
        projectDetail: cloneDeep(this.projectDetail)
      }
    }

    if (!renderEngine) {
      renderEngine = _.get(window.hetu, 'default')
      if (renderEngine) {
        renderEngine.mount('#render-engine', props)
      }
    } else {
      renderEngine.update(props)
    }
    return null

    // return <C {...props} />
  }

  render() {
    // const {
    //   isCloneModalVisible,
    //   isLocalPage,
    //   isPageInit,
    //   errorMessage,
    //   userInfo,
    //   pageConfig,
    //   projectDetail,
    //   activePanekey,
    //   panes
    // } = this.state

    // 是否允许编辑
    let canEdit
    // 是否允许克隆
    let canClone

    if (_.get(this.projectDetail, 'role') === 'super') {
      canEdit = canClone = true
    }

    if (parentType || window.__POWERED_BY_QIANKUN__) {
      canEdit = canClone = false
    }

    if (
      _.get(this.projectDetail, 'whitelist') &&
      !_.get(this.projectDetail, 'role')
    ) {
      console.log('抱歉, 您无权访问该项目')
      // return <Exception403 />
    }

    const isProd = window.ENV === 'prod'

    return (
      <div>
        <div className="page-home">
          {/* <div className="page-home-buttons">
            {canEdit && (
              <IconButton
                icon="folder"
                title="项目管理"
                href={this.getProjectUrl()}
              />
            )}

            {!isProd && canEdit && (
              <IconButton
                icon="edit"
                title="进入编辑器"
                target="_self"
                disabled={isLocalPage}
                href={this.getEditUrl()}
              />
            )}

            {!isProd && canClone && (
              <IconButton
                icon="fork"
                title="克隆页面"
                onClick={this.onCloneBtnClick}
              />
            )}

            {!isProd && canEdit && (
              <IconButton
                icon="cloud-sync"
                title="历史记录"
                disabled={isLocalPage}
                href={`/page/history?projectId=${_.get(
                  projectDetail,
                  'id'
                )}&route=${window.location.pathname}`}
              />
            )}

            {canEdit && (
              <IconButton
                icon="question-circle"
                title="查看文档"
                href="http://139.155.239.172/"
              />
            )}

            {canEdit && (
              <IconButton
                icon="bug"
                title="查看日志"
                href={
                  projectDetail.project_code === 'admin'
                    ? `/__hetu_log__`
                    : `/__log__?projectCode=${projectDetail.project_code}`
                }
              />
            )}
          </div> */}

          <div className="page-home-content">
            {this.renderLayout(this.projectDetail, this.renderContent())}
          </div>
        </div>

        {/* {isPlainObject(pageConfig) && isCloneModalVisible && (
          <TheModalClone
            visible={isCloneModalVisible}
            pageConfig={pageConfig}
            projectDetail={projectDetail}
            onChange={(v: any) => this.setState({ isCloneModalVisible: v })}
          />
        )} */}
      </div>
    )
  }
}
