<template>
  <div
    class="fc-dropdown"
    @mouseenter="show"
    @mouseleave="hide"
  >
    <slot />
    <slot name="dropdown" />
  </div>
</template>
<script>
export default {
  provide() {
    return {
      dropdown: this,
    };
  },
  data() {
    return {
      visible: false,
    };
  },
  methods: {
    show() {
      this.visible = true;
    },
    hide() {
      this.visible = false;
    },
  },
};
</script>
<style lang="scss">
.fc-dropdown {
  position: relative;

  &.active {
    .fc-dropdown-menu {
      display: block;
    }
  }
}
</style>
