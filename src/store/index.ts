/*
 * @Description: store
 * @Autor: Lizijie
 * @Date: 2020-04-23 16:56:03
 * @LastEditors: Lizijie
 * @LastEditTime: 2020-08-13 09:53:51
 */
import Vue from 'vue'
import Vuex from 'vuex'
import global from './modules/global'
import guiEditor from './modules/guiEditor'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {},
  mutations: {},
  actions: {},
  modules: {
    global,
    guiEditor
  }
})
