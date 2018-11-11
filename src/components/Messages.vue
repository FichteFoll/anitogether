<template>
  <!-- TODO transitions -->
  <div id="messages">
    <sui-message v-for="(message, index) of messages"
      :class="[message.kind === 'error' ? 'negative' : message.kind]"
      :header="(message.title || '') + (message.count > 1 ? ` (${message.count})` : '')"
      :content="message.text"
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
