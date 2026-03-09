import { ref } from 'vue'
import { defineStore } from 'pinia'

export interface UserInfo {
  id?: string
  name: string
  email?: string
  phone?: string
}

export const userInfoStore = defineStore('userInfo', {
  state: () => ({
    userInfo: {} as UserInfo,
    token: '',
  }),
  getters: {
    getUserInfo: (state) => state.userInfo,
    getToken: (state) => state.token,
  },
  actions: {
    setUserInfo(userInfo: UserInfo) {
      this.userInfo = userInfo
    },
    setToken(token: string) {
      this.token = token
    },
    clearUserInfo() {
      this.$reset()
    }
  },
  persist: true
})
