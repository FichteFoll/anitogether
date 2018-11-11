<template>
  <sui-form-fields>
    <sui-form-field width="thirteen">
      <sui-dropdown
        multiple
        placeholder="Search users…"
        search
        fluid
        selection
        :options="options"
        allow-additions
        :value="value"
        @input="$emit('input', $event);"
      />
    </sui-form-field>
    <sui-form-field width="three">
      <sui-button
        floated="right"
        icon="delete"
        size="small">
        Clear history
      </sui-button>
    </sui-form-field>
  </sui-form-fields>
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
