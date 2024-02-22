<template>
  <div class="fc-dropdown">
    <slot />
    <slot name="dropdown" />
  </div>
</template>
<script>
export default {

};
</script>
<style lang="scss">
.fc-dropdown {
  position: relative;

  &:hover,
  &.active {
    .fc-dropdown-menu {
      display: block;
    }
  }
}
</style>
