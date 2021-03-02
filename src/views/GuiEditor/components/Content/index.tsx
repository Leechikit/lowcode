import { Component, Vue } from 'vue-property-decorator'
import BaseIframe from '@/components/Iframe'
import queryString from 'query-string'
import './index.scss'
import { selectedComponentData, IPageConfig } from './interface'
import _ from 'lodash'
import { getContainerData, getHetu } from '@/utils'
import { isKeyboardEvent } from '@/constant/keyboardEvent'
import TheStage from '@/views/GuiEditor/components/Stage'
import { LeftWidth, HeaderHeight } from '@/views/GuiEditor'

// 判断是否为可操作组件
export function getComponentProps(
  el: Element,
  pageConfig: IPageConfig
): null | selectedComponentData {
  if (el && el.nodeType === 1) {
    // 判断是否为DOM节点, 必须同时有这两个key, 才是有效的组件节点
    const dataPageConfigPath = el.getAttribute('data-pageconfig-path')
    const dataComponentType = el.getAttribute('data-component-type')

    const isValidComponentType = getHetu('isValidComponentType')
    if (!isValidComponentType(dataComponentType) || !dataPageConfigPath) {
      // 向父节点查找
      return getComponentProps(el.parentNode as Element, pageConfig)
    }
    const dataProps = _.get(pageConfig, dataPageConfigPath)

    if (_.isPlainObject(dataProps)) {
      const reac = el.getBoundingClientRect()
      return {
        parentNode: el.parentNode,
        reac,
        dataPageConfigPath,
        dataComponentType
      }
    } else {
      console.warn(`data-pageconfig-path:${dataPageConfigPath} is not valid`)
    }
  }

  return null
}

@Component
export default class TheContent extends Vue {
  private width = '100%'

  private height = '100%'

  private interval: any

  private iframe: any

  private $element: any

  private lastCalculationTime: Date = new Date()

  private intervalCalculationSelectedComponentData: any

  mounted() {
    this.$element = this.$refs.theGuiContent
  }

  get isIframeLoading() {
    return this.$store.state.guiEditor.isIframeLoading
  }

  get pageConfig() {
    return this.$store.state.guiEditor.pageConfig
  }

  get isLockIframe() {
    return this.$store.state.guiEditor.isLockIframe
  }

  get isDragging() {
    return this.$store.state.guiEditor.isDragging
  }

  onIframeLoad() {
    const iframeDocument = _.get(this.iframe, 'contentWindow.document')
    // 每1秒去获取iframe的尺寸, 当修改元素, iframe 有延迟渲染时, 可以同步尺寸
    this.interval = setInterval(() => {
      this.width =
        iframeDocument.documentElement.scrollWidth ||
        iframeDocument.body.scrollWidth
      this.height =
        iframeDocument.documentElement.scrollHeight ||
        iframeDocument.body.scrollHeight
    }, 1000)
  }

  // 绑定键盘事件
  onKeyDown(e: KeyboardEvent) {
    if (e.metaKey && e.keyCode === 83) {
      // 如果按键是command + s 则阻止默认行为，避免触发网页的保存
      e.preventDefault()
    }

    // TODO 根据不同的系统, 配置默认快捷键, 并允许用户配置快捷键
    if (isKeyboardEvent(e, 'shift')) {
      // ctrl + shift || commond + shift
      this.$store.commit('guiEditor/setState', {
        isLockIframe: !this.isLockIframe
      })
    }
  }

  onStageMouseMove() {
    return _.throttle(e => {
      if (this.isIframeLoading || this.isDragging) return false

      // 获取点击的坐标
      const { clientX, clientY } = e
      if (!this.$el) return false
      const scrollTop = _.get(this.$el, 'parentNode.scrollTop')
      const scrollLeft = _.get(this.$el, 'parentNode.scrollLeft')

      const iframeDocument = _.get(this.iframe, 'contentWindow.document')
      if (_.isFunction(iframeDocument.elementFromPoint)) {
        const el = iframeDocument.elementFromPoint(
          clientX - LeftWidth + scrollLeft,
          clientY - HeaderHeight + scrollTop
        )
        const hoverComponentData = getComponentProps(el, this.pageConfig)
        // console.log('hoverComponentData: ', hoverComponentData)
        if (hoverComponentData) {
          this.$store.commit('guiEditor/setState', {
            hoverComponentData
          })
        }
      }
    }, 100)
  }

  onStageMouseLeave() {
    return _.debounce(() => {
      this.$store.commit('guiEditor/setState', {
        hoverComponentData: null
      })
    }, 500)
  }

  /**
   * 点击页面任意位置
   */
  onStageClick() {
    const {
      pageConfig,
      hoverComponentData,
      selectedComponentData,
      containerData,
      isIframeLoading,
      isDragging
    } = this.$store.state.guiEditor

    const _onStageClick = () => {
      this.lastCalculationTime = new Date()
      if (
        isIframeLoading ||
        isDragging ||
        !_.isPlainObject(hoverComponentData)
      ) {
        return { containerData, selectedComponentData }
      } else {
        const { dataComponentType } = hoverComponentData

        const selectedButtons = getHetu([
          'editConfigMap',
          dataComponentType,
          'selectedButtons'
        ])

        const _containerData = getContainerData(pageConfig, hoverComponentData)

        this.$store.commit('guiEditor/setState', {
          selectedComponentData: hoverComponentData,
          activeTab: 'base',
          containerData: _containerData,
          isInsertItemMode: selectedButtons.indexOf('add') !== -1
        })

        return {
          containerData: _containerData,
          selectedComponentData: hoverComponentData
        }
      }
    }

    return _onStageClick()
  }

  getIframeUrl() {
    const { route, query } = queryString.parse(window.location.search)
    return route + (query ? '?' + query : '')
  }

  render() {
    const stageStyle = {
      height: _.isNumber(this.height) ? `${this.height}px` : this.height,
      width: _.isNumber(this.width) ? `${this.width}px` : this.width
    }
    const iframeSrc = this.getIframeUrl()
    return (
      <div class="the-gui-content" style={stageStyle} ref="theGuiContent">
        <BaseIframe
          {...{
            props: {
              src: iframeSrc,
              loadCallback: this.onIframeLoad,
              keydownCallback: this.onKeyDown,
              getRef: (c: any) => {
                this.iframe = c
              }
            }
          }}
        />
        {this.isLockIframe && (
          <TheStage
            props= {{
              stageStyle: stageStyle,
              mouseMoveCallback: this.onStageMouseMove(),
              mouseLeaveCallback: this.onStageMouseLeave(),
              clickCallback: this.onStageClick
            }}
          />
        )}
      </div>
    )
  }
}
