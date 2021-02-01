import { Component, Prop, Vue } from 'vue-property-decorator'
import './index.scss'

@Component
export default class TheContent extends Vue {
  render() {
    return (
      <div
        class='the-gui-content'
      >
      </div>
    )
  }
}