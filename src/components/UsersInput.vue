<template>
  <sui-form-field>
    <sui-dropdown
      multiple
      placeholder="Search users…"
      search
      fluid
      selection
      :options="options"
      allow-additions
      :value="value"
      @input="$emit('input', $event)"
    />
  </sui-form-field>
</template>

<script>
export default {
  props: {
    value: Array,
    userHistory: Array,
  },
  computed: {
    options () {
      return this.userHistory.map(x => ({text: x, value: x}))
    },
  },
}
</script>
