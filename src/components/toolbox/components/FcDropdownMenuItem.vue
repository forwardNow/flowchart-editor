<template>
  <div v-if="divided" class="fc-dropdown-menu-item-divider" />
  <div v-else class="fc-dropdown-menu-item" @click="emitClickEvent">
    <div class="fc-dropdown-menu-item-inner">
      <template v-if="$slots.icon">
        <div class="fc-dropdown-menu-item-icon">
          <slot name="icon" />
        </div>
      </template>
      <template v-else>
        <div class="fc-dropdown-menu-item-icon" :class="icon" />
      </template>

      <div class="fc-dropdown-menu-item-text">
        <template v-if="$slots.label">
          <slot name="label" />
        </template>
        <template v-else>
          {{ label }}
        </template>
      </div>

      <div class="fc-dropdown-menu-item-hotkey">
        <template v-if="$slots.hotkey">
          <slot name="hotkey" />
        </template>
        <template v-else>
          {{ hotkey }}
        </template>
      </div>
    </div>
  </div>
</template>
<script>
export default {
  name: 'FcMenuItem',

  inject: ['dropdown'],

  props: {
    icon: { type: String, default: '' },
    divided: { type: Boolean, default: false },
    label: { type: String, default: '' },
    hotkey: { type: String, default: '' },
  },

  methods: {
    emitClickEvent() {
      this.dropdown.hide();

      this.$emit('click');
    },
  },
};
</script>
<style lang="scss">
.fc-dropdown-menu-item {
  display: block;
  padding: 0 4px;
  margin-bottom: 2px;
}

.fc-dropdown-menu-item-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;

  padding-right: 8px;
  height: 32px;
  line-height: 32px;
  border-radius: 4px;
  cursor: pointer;

  &:hover {
    background-color: #f3f5f9;
  }
}

.fc-dropdown-menu-item-icon {
  width: 32px;
  height: 32px;
  background: no-repeat center center;
  background-size: 60% 60%;
}
.fc-dropdown-menu-item-text {
  flex: 1;
}
.fc-dropdown-menu-item-hotkey {
  padding-left: 32px;
  color: #a6b9cd;
  font-size: 12px;
}

.fc-dropdown-menu-item-divider {
  height: 0;
  border-top: 1px solid #e9edf2;
  margin: 4px;
}
</style>
