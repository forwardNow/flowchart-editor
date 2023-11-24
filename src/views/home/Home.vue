<template>
  <div class="view-list">
    <router-link
      class="view-item"
      v-for="(item, i) in routes"
      :key="i"
      :to="item.path"
    >
      {{ item.path }}
    </router-link>
  </div>
</template>
<script>
import { routes } from '../../router/router.js';
export default {
  data() {
    return {
      routes
    };
  },
}
</script>
<style lang="scss">
@import "../../commons/styles/vars";

.view-list {
  display: flex;
  align-items: center;
  flex-wrap: wrap;

  .view-item {
    margin: 16px 0 0 16px;
    display: flex;
    align-items: center;
    justify-content: center;

    width: 200px;
    height: 120px;

    border: solid 1px #ddd;
    border-radius: 6px;

    color: $color-primary;
  }
}
</style>
