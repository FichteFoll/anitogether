<template>
  <!-- TODO transitions -->
  <div id="messages">
    <sui-message v-for="(message, index) of messages"
      :key="message.text"
      :class="[message.kind === 'error' ? 'negative' : message.kind]"
      :header="(message.title || '')"
      :content="message.text + (message.count > 1 ? ` (${message.count})` : '')"
      dismissable
      @dismiss="$emit('dismiss', index)"
    />
  </div>
</template>

<script>
export default {
  props: {
    messages: Array,
  },
}
</script>
