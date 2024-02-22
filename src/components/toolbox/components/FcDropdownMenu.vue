<template>
  <div class="fc-dropdown-menu">
    <slot />
  </div>
</template>
<script>
export default {
};
</script>
<style lang="scss">
.fc-dropdown-menu {
  display: none;
  position: absolute;
  top: 100%;
  left: 0;

  padding-top: 4px;
  padding-bottom: 2px;

  width: 180px;

  background: #fff;
  border: #e9edf2;
  box-shadow: 0 4px 10px 0 rgba(0,0,0,.1);
  border-radius: 4px;
  color: #212930;
  font-size: 13px;
}
</style>
