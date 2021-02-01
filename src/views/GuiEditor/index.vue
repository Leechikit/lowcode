<template>
  <el-container class="page-guiEditor-layout page-guiEditor">
    <el-container class="page-guiEditor-layout">
      <el-header>
        <TheHeader />
      </el-header>
      <el-container class="page-guiEditor-layout">
        <el-aside :width="`${LeftWidth}px`">
          <TheSiderLeft />
        </el-aside>
        <el-main>
          <TheContent />
        </el-main>
      </el-container>
    </el-container>
    <el-aside :width="`${RightWidth}px`">
      <TheSiderRight />
    </el-aside>
  </el-container>
</template>
<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import TheContent from './components/Content/index.vue'
import TheHeader from './components/Header/index.vue'
import TheSiderLeft from './components/SiderLeft/index.vue'
import TheSiderRight from './components/SiderRight/index.vue'
import { IPageConfig } from '@/types/models/global'
import { initSubmodules } from '@/utils'

export const LeftWidth = 250
export const RightWidth = 300
@Component({
  components: {
    TheContent,
    TheHeader,
    TheSiderLeft,
    TheSiderRight
  }
})
export default class Header extends Vue {
  @Prop() private pageConfig!: IPageConfig

  private LeftWidth = LeftWidth
  private RightWidth = RightWidth

  mounted() {
    this.initIframe()
  }

  /**
   * 初始化iframe
   */
  async initIframe() {
    await initSubmodules('submodules')
  }
}
</script>
<style lang="scss" scoped>
@import './index.scss';
</style>
