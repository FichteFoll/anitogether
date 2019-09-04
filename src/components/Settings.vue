<template>
  <sui-form-fields>
    <sui-form-field>
      <label>Title format</label>
      <sui-form-fields inline>
        <sui-form-field v-for="format of formats" :key="format.value">
          <sui-checkbox
            radio
            :label="format.label"
            :value="format.value"
            v-model="current"
            @change="$emit('inputFormat', $event)"
          />
        </sui-form-field>
      </sui-form-fields>
    </sui-form-field>

    <sui-form-field>
      <label>Minimum users for shared anime</label>
      <sui-form-fields inline>
        <sui-form-field>
          <sui-input type="number" :value="minShared"
            :disabled="allShared"
            @input="$emit('inputMinShared', Number($event))"
          />
        </sui-form-field>
        <sui-form-field>
          <sui-checkbox
            label="All"
            :inputValue="allShared"
            @change="$emit('inputAllShared', $event)"
          />
        </sui-form-field>
      </sui-form-fields>
    </sui-form-field>

    <sui-form-field>
      <label>History</label>
      <sui-button
        floated="right"
        icon="delete"
        compact
        @click="$emit('clearHistory')"
      >
        Clear history
      </sui-button>
    </sui-form-field>

    <sui-form-field>
      <label>Other</label>
      <sui-checkbox
        label="Hide seen by all"
        :inputValue="hideSeen"
        @change="$emit('inputHideSeen', $event)"
      />
      <sui-checkbox
        label="Dark mode"
        :inputValue="dark"
        @change="$emit('inputDark', $event)"
      />
    </sui-form-field>
  </sui-form-fields>
</template>

<script>
export default {
  props: {
    minShared: Number,
    allShared: Boolean,
    titleFormat: String,
    hideSeen: Boolean,
    dark: Boolean,
  },
  data () {
    return {
      current: this.titleFormat, // need this to sync radios
      formats: [
        { label: "Romaji",  value: "romaji" },
        { label: "English", value: "english" },
        { label: "Native",  value: "native" },
      ],
    }
  },
  watch: {
    titleFormat () {
      this.current = this.titleFormat
    },
  },
}
</script>
