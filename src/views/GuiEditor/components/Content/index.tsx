import { Component, Prop, Vue } from 'vue-property-decorator'
import BaseIframe from '@/components/Iframe'
import queryString from 'query-string'
import './index.scss'
import { Props, selectedComponentData, IPageConfig } from './interface'
import _ from 'lodash'
import { getHetu } from '@/utils'
import { isKeyboardEvent } from '@/constant/keyboardEvent'

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
  @Prop({
    default: () => {
      return {}
    }
  })
  props!: Props

  private width = '100%'

  private height = '100%'

  private interval: any

  private iframe: HTMLIFrameElement

  private $el: HTMLDivElement

  onIframeLoad(e: Event) {
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
    const { isLockIframe } = this.$store.state.guiEditor

    if (e.metaKey && e.keyCode === 83) {
      // 如果按键是command + s 则阻止默认行为，避免触发网页的保存
      e.preventDefault()
    }

    // TODO 根据不同的系统, 配置默认快捷键, 并允许用户配置快捷键
    if (isKeyboardEvent(e, 'shift')) {
      // ctrl + shift || commond + shift
      this.$store.commit('guiEditor/setState', {
        isLockIframe: !isLockIframe
      })
    }
  }

  getIframeUrl() {
    const { route, query } = queryString.parse(window.location.search)
    return route + (query ? '?' + query : '')
  }

  render() {
    const stageStyle = {
      height: _.isNumber(this.height) ? `${this.height}px` : this.height,
      width: _.isNumber(this.width) ? `${this.width}px` : this.width,
    }
    const iframeSrc = this.getIframeUrl()
    return (
      <div
        className="the-gui-content"
        style={stageStyle}
        ref={el => (this.$el = el)}>
        <BaseIframe
          getRef={c => {
            this.iframe = c
          }}
          src={iframeSrc}
          loadCallback={this.onIframeLoad}
          onKeydown={this.onKeyDown}
        />
      </div>
    )
  }
}
