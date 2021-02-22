import { Component, Prop, Vue } from 'vue-property-decorator'
import _ from 'lodash'
import './index.scss'

@Component
export default class TheSiderLeft extends Vue {
  @Prop(String) src!: string
  @Prop(Function) loadCallback?: Function
  @Prop(Function) getRef?: Function
  @Prop(Function) onKeydown?: Function

  private iframe?:HTMLIFrameElement

  mounted() {
    this.iframe = this.$refs.iframe
    if (_.isFunction(this.getRef)) {
      this.getRef(this.iframe)
    }

    if (this.iframe && _.isFunction(this.onKeydown)) {
      const iframeWinow = this.iframe.contentWindow
      iframeWinow && iframeWinow.addEventListener('keydown', this.onKeydown)
    }
  }

  destoryed() {
    if (this.iframe  && _.isFunction(this.onKeydown)) {
      const iframeWinow = this.iframe.contentWindow
      iframeWinow && iframeWinow.removeEventListener('keydown', this.onKeydown)
    }
  }

  render() {
    const { src, onKeydown, loadCallback, getRef, ...otherProps } = this.$props
    return (
      <iframe
        ref="iframe"
        {...otherProps}
        class="base-iframe"
        src={src}
        onLoad={loadCallback}
      />
    )
  }
}
