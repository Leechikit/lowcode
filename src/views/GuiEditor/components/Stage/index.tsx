import { Component, Prop, Vue } from 'vue-property-decorator'
import _ from 'lodash'
import './index.scss'

@Component
export default class Stage extends Vue {
  @Prop(Function) mouseMoveCallback!:  (this: HTMLElement, ev: MouseEvent) => any
  @Prop(Function) mouseLeaveCallback!:  (this: HTMLElement, ev: MouseEvent) => any
  @Prop(Function) clickCallback!:  (this: HTMLElement, ev: MouseEvent) => any
  @Prop(Object) stageStyle?: {}

  private $stage?: any

  mounted() {
    this.$stage = this.$refs.theStageWrap
    if (this.$stage) {
      this.$stage.addEventListener('mousemove', this.mouseMoveCallback)
      this.$stage.addEventListener('mouseleave', this.mouseLeaveCallback)
    }
  }

  destoryed() {
    if (this.$stage) {
      this.$stage.removeEventListener('mousemove', this.mouseMoveCallback)
      this.$stage.removeEventListener('mouseleave', this.mouseLeaveCallback)
    }
  }

  render() {
    const { stageStyle, clickCallback } = this.$props
    const { selectedComponentData } = this.$store.state.guiEditor

    const type = _.get(selectedComponentData, 'dataComponentType')
    return (
      <div
        ref="theStageWrap"
        class="the-stage-wrap"
        style={stageStyle}
        onClick={clickCallback}></div>
    )
  }
}
