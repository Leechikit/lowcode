import { Component, Prop, Vue } from 'vue-property-decorator'
import _ from 'lodash'
import queryString from 'query-string'
import { initSubmodules } from '@/utils'

import TheContent from './components/Content'
import TheHeader from './components/Header'
import TheSiderLeft from './components/SiderLeft'
import TheSiderRight from './components/SiderRight'
import { TheGuiEditorProps } from './interface'
import { getDefaultSubmodule } from '@/constant/submodule'
import './index.scss'
import { Loading } from 'element-ui'

export const LeftWidth = 250
export const RightWidth = 300
export const HeaderHeight = 64

@Component
export default class GuiEditor extends Vue {
  @Prop({
    default: () => {
      return {}
    }
  })
  props!: TheGuiEditorProps

  private isPageInit?: boolean = false

  private pageLoading:any = null

  get projectDetail() {
    return this.$store.state.global.projectDetail
  }

  get pageConfig() {
    return this.$store.state.guiEditor.pageConfig
  }

  get isLockIframe() {
    return this.$store.state.guiEditor.isLockIframe
  }

  created() {
    window.$$isEditor = true
    window.$$receiveIframeData = this.receiveIframeData
  }

  mounted() {
    const { route, query, draftId } = queryString.parse(
      window.location.href.split('?')[1]
    )
    this.initIframe(route as string, query as dynamicObject, draftId as string)
  }

  /**
   * 初始化iframe
   */
  async initIframe(route: string, query: dynamicObject, draftId: string) {
    if (route) {
      // 根据页面路径获取项目详情
      // const projectDetail = await this.$store.dispatch(
      //   'global/getAsyncProjectDetail',
      //   { pathname: route }
      // )
      // 项目的超级管理员才能够编辑页面
      // 获取页面配置
      const pageConfig: any = await this.$store.dispatch(
        'guiEditor/getPageConfig',
        {
          path: route,
          draftId
        }
      )

      // 更新页面配置, 更新iframe
      this.$store.dispatch(
        'guiEditor/updatePageConfigAndIframe',
        {
          key: null,
          value: pageConfig
        }
      )

      // 设置iframe
      this.$store.commit(
        'guiEditor/setState',
        {
          query: queryString.parse(query as any)
        }
      )

      const submodules = getDefaultSubmodule()
      await initSubmodules(submodules)
      this.isPageInit = true
    }
  }

  // 接收iframe发送的数据
  receiveIframeData = ({
    type,
    data
  }: {
    type: string
    data: dynamicObject
  }) => {
    if (type === 'receiveIframeData' && _.isPlainObject(data)) {
      const { changePageConfig, pagestate } = data
      if (_.isFunction(changePageConfig)) {
        window.$$changeIframePageConfig = changePageConfig
      }

      // if (_.isPlainObject(pagestate)) {
      // }
    }
  }

  render() {
    if (!this.isPageInit) {
      this.pageLoading = Loading.service({})
      return 
    } else {
      this.pageLoading.close()
    }

    return (
      <el-container class="page-guiEditor-layout page-guiEditor">
        <el-container class="page-guiEditor-layout">
          <el-header>
            <TheHeader />
          </el-header>
          <el-container class="page-guiEditor-layout">
            <el-aside width={`${LeftWidth}px`}>
              <TheSiderLeft />
            </el-aside>
            <el-main>
              <TheContent />
            </el-main>
          </el-container>
        </el-container>
        <el-aside width={`${RightWidth}px`}>
          <TheSiderRight />
        </el-aside>
      </el-container>
    )
  }
}
