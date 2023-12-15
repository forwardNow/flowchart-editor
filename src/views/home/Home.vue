<template>
  <div class="card-list">
    <router-link
      class="card"
      v-for="(item, i) in cards"
      :key="i"
      :to="item.path"
    >
      <span class="card-title">{{ item.title }}</span>
      <span class="card-desc">{{ item.description }}</span>
    </router-link>
  </div>
</template>
<script>
import { routes } from '@/router/router';

export default {
  data() {
    return {
      routes,
    };
  },

  computed: {
    cards() {
      return this.routes
        .map((route) => {
          const { path, meta: { title, description, display } } = route;
          return {
            path, title, description, display: display !== false,
          };
        }).filter((item) => Boolean(item.display));
    },
  },
};
</script>
<style lang="scss">
.card-list {
  display: flex;
  align-items: center;
  flex-wrap: wrap;

  font-size: 14px;
  line-height: 1.2;
  font-family: "Helvetica Neue", Helvetica, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "微软雅黑", Arial, sans-serif;

  .card {
    display: block;

    margin: 16px 0 0 16px;

    width: 200px;
    height: 120px;

    border: solid 1px #ddd;
    border-radius: 6px;

    text-decoration: none;
  }

  .card-title {
    display: block;
    margin-top: 16px;

    text-align: center;
    color: #333;
    font-size: 18px;
  }

  .card-desc {
    display: block;
    margin: 8px 16px;
    color: #666;
  }
}
</style>
