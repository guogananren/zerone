<template>
  <h4>登录界面</h4>
  <el-form ref="formRef" :model="loginInfo">
    <el-form-item required prop="account">
      <el-input type="text" placeholder="请输入用户名" v-model="loginInfo.account" />
    </el-form-item>
  </el-form>
  <br>
  <!-- <el-input type="password" placeholder="请输入密码" />
  <br> -->
  <el-button type="primary" @click="login(formRef)">登录</el-button>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus'
import type { FormInstance } from 'element-plus'
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router'
import { userInfoStore } from '@/stores/user';

const formRef = ref()
const loginInfo = reactive({
  account: '',
  password: ''
})
const router = useRouter()
function login(form: FormInstance | undefined) {
  if (!form) return
  form.validate((valid) => {
    if (valid) {
      ElMessage({
        message: '登录成功',
        type: 'success'
      });
      const userStore = userInfoStore()
      userStore.setUserInfo({
        name: loginInfo.account
      })
      userStore.setToken('xxx')
      
      router.push('/')
    } else {
      ElMessage({
        message: '登录失败',
        type: 'error'
      })
    }
  })
}
</script>