<script setup lang="ts">
import { useRouter } from 'vue-router'
import Icon from '@@/components/Icon/index.vue'
import { userInfoStore } from '@/stores/user'

const userInfo = userInfoStore()
const router = useRouter()

function goToChat() {
  router.push('/chat')
}
function logout() {
  userInfo.clearUserInfo()
  router.push('/login')
}
</script>

<template>
  <div class="home">
    <nav class="nav">
      <div class="nav-inner">
        <div class="logo">ZERONE</div>
        <div class="nav-links" @click="logout">
          登出
        </div>
      </div>
    </nav>

    <main class="main">
      <div class="main-inner">
        <div class="hero">
          <div class="hero-label">
            <div class="label-bar" />
            <span class="label-text">From Zero to One</span>
          </div>
          <h1 class="hero-title">
            从零到一<br />
            开启对话之旅
          </h1>
          <p class="hero-desc">
            ZERONE是一个简洁而强大的对话平台，<br />
            帮助您探索思想的边界，创造无限可能。
          </p>
          <button class="hero-btn" @click="goToChat">
            <span>开始对话</span>
            <Icon name="arrow-right" :width="18" :height="18" class="btn-icon" />
          </button>
        </div>

        <div class="cards">
          <button class="card card-active" @click="goToChat">
            <Icon name="message-square" :width="32" :height="32" class="card-icon" />
            <h3 class="card-title">智能对话</h3>
            <p class="card-desc">
              通过自然的对话方式，获得即时的回应与帮助。体验流畅而深入的交流。
            </p>
            <div class="card-footer">
              <span>体验功能</span>
              <span class="card-arrow"><Icon name="arrow-right" :width="18" :height="18" /></span>
            </div>
          </button>
          <div class="card card-disabled">
            <Icon name="sparkles" :width="32" :height="32" class="card-icon" />
            <h3 class="card-title">更多功能</h3>
            <p class="card-desc">
              更多创新功能正在开发中，敬请期待。
            </p>
            <div class="card-footer disabled">即将推出</div>
          </div>
        </div>

        <div class="philosophy">
          <h2 class="philosophy-title">设计理念</h2>
          <div class="philosophy-content">
            <p>
              ZERONE相信，最好的技术应该是不被察觉的。我们追求极简、自然、本质的设计哲学。
            </p>
            <p>
              从零开始，到达唯一。每一次对话都是一次新的创造，每一个想法都值得被倾听和尊重。
            </p>
          </div>
        </div>
      </div>
    </main>

    <footer class="footer">
      <div class="footer-inner">
        <div class="footer-copy">ZERONE © 2026</div>
        <div class="footer-tagline">From Zero to One</div>
      </div>
    </footer>
  </div>
</template>

<style scoped lang="scss">
@use '@@/assets/styles/variables.scss' as *;

.home {
  min-height: 100vh;
  background: $zerone-bg-white;
}

.nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 50;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(4px);
  border-bottom: 1px solid $zerone-border;
}

.nav-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 48px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo {
  font-size: 20px;
  letter-spacing: 0.08em;
  color: $zerone-text-primary;
  font-weight: 300;
}

.nav-links {
  display: flex;
  gap: 32px;
  cursor: pointer;
}

.nav-link {
  font-size: 14px;
  letter-spacing: 0.02em;
  color: $zerone-text-secondary;
  text-decoration: none;
  font-weight: 300;
  transition: color 0.2s;

  &:hover {
    color: $zerone-text-primary;
  }
}

.main {
  padding: 128px 48px 96px;
}

.main-inner {
  max-width: 1200px;
  margin: 0 auto;
}

.hero {
  max-width: 680px;
  margin-bottom: 128px;
}

.hero-label {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
}

.label-bar {
  width: 4px;
  height: 48px;
  background: $zerone-bg-dark;
}

.label-text {
  font-size: 13px;
  letter-spacing: 0.15em;
  color: $zerone-text-secondary;
  text-transform: uppercase;
  font-weight: 300;
}

.hero-title {
  font-size: 56px;
  line-height: 1.3;
  letter-spacing: 0.02em;
  color: $zerone-text-primary;
  font-weight: 300;
  margin: 0 0 32px;
}

.hero-desc {
  font-size: 17px;
  line-height: 2;
  letter-spacing: 0.01em;
  color: $zerone-text-secondary;
  font-weight: 300;
  margin: 0 0 48px;
}

.hero-btn {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 16px 32px;
  background: $zerone-bg-dark;
  color: white;
  border: none;
  cursor: pointer;
  border-radius: 2px;
  font-size: 15px;
  letter-spacing: 0.02em;
  font-weight: 300;
  transition: background 0.2s;

  &:hover {
    background: $zerone-bg-dark-hover;
  }
}

.btn-icon {
  transition: transform 0.2s;
}

.hero-btn:hover .btn-icon {
  transform: translateX(4px);
}

.cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 48px;
  margin-bottom: 128px;
}

.card {
  padding: 48px;
  background: $zerone-bg-light;
  border: 1px solid $zerone-border;
  border-radius: 2px;
  text-align: left;
  cursor: pointer;
  transition: background 0.2s;

  &-active:hover {
    background: $zerone-bg-hover;
  }

  &-disabled {
    cursor: default;
    opacity: 0.6;
  }
}

.card-icon {
  font-size: 32px;
  color: $zerone-text-primary;
  margin-bottom: 32px;
  display: block;
}

.card-title {
  font-size: 24px;
  letter-spacing: 0.02em;
  color: $zerone-text-primary;
  font-weight: 300;
  margin: 0 0 16px;
}

.card-desc {
  font-size: 15px;
  line-height: 1.9;
  letter-spacing: 0.01em;
  color: $zerone-text-secondary;
  font-weight: 300;
  margin: 0 0 24px;
}

.card-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: $zerone-text-primary;

  &.disabled {
    color: $zerone-text-muted;
  }
}

.card-arrow {
  display: inline-flex;
  transition: transform 0.2s;
}

.card-active:hover .card-arrow {
  transform: translateX(4px);
}

.philosophy {
  max-width: 680px;
  padding-top: 96px;
  border-top: 1px solid $zerone-border;
}

.philosophy-title {
  font-size: 32px;
  letter-spacing: 0.02em;
  color: $zerone-text-primary;
  font-weight: 300;
  margin: 0 0 32px;
}

.philosophy-content {
  display: flex;
  flex-direction: column;
  gap: 32px;
  font-size: 15px;
  line-height: 2;
  letter-spacing: 0.01em;
  color: $zerone-text-secondary;
  font-weight: 300;
}

.footer {
  border-top: 1px solid $zerone-border;
  background: $zerone-bg-light;
}

.footer-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 48px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.footer-copy {
  font-size: 14px;
  letter-spacing: 0.08em;
  color: $zerone-text-muted;
  font-weight: 300;
}

.footer-tagline {
  font-size: 13px;
  letter-spacing: 0.02em;
  color: $zerone-text-muted;
  font-weight: 300;
}

@media (max-width: 768px) {
  .cards {
    grid-template-columns: 1fr;
  }

  .nav-inner,
  .main {
    padding-left: 24px;
    padding-right: 24px;
  }

  .hero-title {
    font-size: 40px;
  }
}
</style>
