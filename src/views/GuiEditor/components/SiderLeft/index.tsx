import { Component, Prop, Vue } from 'vue-property-decorator'
import { getContainerData, getHetu } from '@/utils'
import { isElementConfig } from '@/utils/valid'
import { emitter } from '@/utils/events'
import { TheSiderLeftProps, Option } from './interface'
import { command } from '@/constant/keyboardEvent'
import _ from 'lodash'
import './index.scss'

@Component
export default class TheSiderLeft extends Vue {
  @Prop({
    default: () => {
      return {}
    }
  })
  props!: TheSiderLeftProps

  /**
   * 插入一个新的节点
   */
  async insertNewItem(insertItem: any, property: string) {
    const { pageConfig, selectedComponentData } = this.props

    const containerData = getContainerData(pageConfig, selectedComponentData)

    if (!containerData || !_.get(containerData, 'path')) {
      return false
    }

    const dataPageConfigPath = containerData.path
    if (!dataPageConfigPath) return

    const conponentPageConfig = _.get(pageConfig, dataPageConfigPath)

    let insertPath = `${dataPageConfigPath}.${property}`
    if (isElementConfig(conponentPageConfig)) {
      if (
        property === 'children' &&
        getHetu('allowContainers').indexOf(conponentPageConfig.type) !== -1
      ) {
        // 容器组件
        insertPath = `${dataPageConfigPath}.${property}`
      } else {
        // 如果为标准组件
        insertPath = `${dataPageConfigPath}.props.${property}`
      }
    }

    const insertTarget: any[] = _.get(pageConfig, insertPath, [])

    const insertIndex: number = insertTarget.length

    const selectedDataPageConfigPath = _.get(
      selectedComponentData,
      'dataPageConfigPath'
    )
    if (
      selectedDataPageConfigPath &&
      selectedDataPageConfigPath.indexOf(insertPath) !== -1
    ) {
      // const { index } = getDataFromDataPropsKey(
      //   selectedDataPageConfigPath,
      //   pageConfig
      // )
      // if (_.isNumber(index)) {
      //   insertIndex = index + 1
      // }
    }

    insertTarget.splice(insertIndex, 0, insertItem)

    const newPageConfig = _.set(pageConfig, insertPath, insertTarget)

    // 关闭插入模式
    await this.$store.dispatch({
      type: 'guiEditor/finishInsertItemMode'
    })
    // 更新页面配置
    await this.$store.dispatch('guiEditor/updatePageConfigAndIframe', {
      key: null,
      value: newPageConfig
    })

    const insertItemPageConfigPath = `${insertPath}[${insertIndex}]`

    emitter.emit('highlightComponent', insertItemPageConfigPath)

    emitter.emit('clickThroughByPageConfigPath', insertItemPageConfigPath)

    return true
  }

  // 锁屏
  onLockBtnClick = (isLockIframe: boolean) => {
    let { activeTab } = this.$store.state.guiEditor

    if (!isLockIframe) {
      activeTab = 'base'
    }
    this.$store.commit('guiEditor/setState', {
      isLockIframe,
      activeTab
    })
  }

  /**
   * 渲染选择面板
   */
  renderDrawer() {
    const { pageConfig, selectedComponentData } = this.$store.state.guiEditor

    let _containerData = getContainerData(pageConfig, selectedComponentData)
    if (!_containerData || !_.isPlainObject(_containerData)) {
      const defaultContainerData = getContainerData(pageConfig)
      if (!defaultContainerData) {
        return null
      }
      _containerData = defaultContainerData
    }

    const additableProperties = getHetu([
      'editConfigMap',
      _containerData.type,
      'additableProperties'
    ])

    if (!_.isPlainObject(additableProperties)) {
      console.warn(
        `组件 ${_containerData.type} GUI配置additableProperties不合法`
      )
      return null
    }

    const children: any = []

    const renderOptions = (options: Option[], property: string) => {
      if (!_.isArray(options)) return null
      return options.map((option, i) => {
        return (
          <div key={`${i}`} class="component-button">
            <el-button
              size="small"
              icon={option.icon}
              block
              onClick={() => {
                this.insertNewItem(option.value, property)
              }}>
              {option.label}
            </el-button>
          </div>
        )
      })
    }
    Object.keys(additableProperties)
      .sort(
        (a, b) => additableProperties[a].order - additableProperties[b].order
      )
      .forEach((key: string, i: number) => {
        const item = additableProperties[key]
        if (_.isArray(item.options)) {
          const Options = renderOptions(item.options, key)
          children.push(
            <div class="property-wrapper" key={`property-wrapper-${i}`}>
              {<div class="property-title">{item.title}</div>}
              <div class="property-content">{Options}</div>
            </div>
          )
        }

        // 分组
        if (_.isArray(item.optionGroups)) {
          const OptionGroup = item.optionGroups.map((group: any, i: number) => {
            return (
              <div
                class="property-wrapper property-options-group"
                key={`property-options-group-${i}`}>
                <div class="property-title">{`${item.title}-${group.title}`}</div>
                <div class="property-content">
                  {renderOptions(group.options, key)}
                </div>
              </div>
            )
          })
          children.push(OptionGroup)
        }
      })

    return children
  }

  render() {
    const { isLockIframe } = this.$store.state.guiEditor

    return (
      <div class="the-sider-left">
        <div class="edit-drawer">{this.renderDrawer()}</div>
        <div class="button-group">
          <a
            onClick={() => this.onLockBtnClick(!isLockIframe)}
            target="_blank"
            class="button">
            {isLockIframe && (
              <el-tooltip
                content={`${command.shift.desc} 切换到预览模式`}
                placement="right">
                <i class="el-icon-lock" style={{ fontSize: '18px' }} />
              </el-tooltip>
            )}
            {!isLockIframe && (
              <el-tooltip
                content={`${command.shift.desc} 切换到编辑模式`}
                placement="right">
                <i class="el-icon-unlock" style={{ fontSize: '18px' }} />
              </el-tooltip>
            )}
          </a>
        </div>
      </div>
    )
  }
}
