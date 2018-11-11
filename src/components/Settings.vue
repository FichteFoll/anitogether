<template>
  <sui-form-fields>
    <sui-form-field>
      <label>Title Format</label>
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

    <sui-form-field >
      <label>Minimum users for shared anime</label>
      <input class="minshared-input" type="number" name="minShared" :value="minShared"
        @input="$emit('inputShared', $event.target.value)"
      />
    </sui-form-field>
  </sui-form-fields>
</template>

<script>
export default {
  props: {
    minShared: String,
    titleFormat: String,
  },
  data () {
    return {
      current: "romaji", // need this for some reason
      formats: [
        { label: "Romaji",  value: "romaji" },
        { label: "English", value: "english" },
        { label: "Native",  value: "native" },
      ],
    }
  },
  watch: {
    titleFormat () {
      this.curret = this.titleFormat
    },
  },
}
</script>
