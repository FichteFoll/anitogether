<template>
  <div id="messages">
    <div v-for="(message, index) of messages"
        class="ui message"
        :class="[message.kind === 'error' ? 'negative' : message.kind]">
      <i class="close icon" @click="$emit('dismiss', index)"></i>
      <div class="header">{{ message.title || "" }}</div>
      {{ message.text || "" }}
      {{ message.count > 1 ? ` (${message.count})` : "" }}
    </div>
  </div>
</template>

<script>
export default {
  props: {
    messages: Array,
  },
}
</script>
