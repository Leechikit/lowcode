import { Component, Vue } from 'vue-property-decorator'

@Component
export default class LayoutBlank extends Vue {
  render() {
    return (
      <div>
        <div id="render-engine"></div>
        {this.$slots.default}
      </div>
    )
  }
}
