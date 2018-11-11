<template>
  <!-- Need to wrap all table cells I intend to animate in a div
    because you cannot override table row or cell sizes. -->
  <sui-table
    class="entry-table"
    definition celled compact unstackable selectable
    :class="{ editing: hideSelectActive }"
  >
    <sui-table-header>
      <sui-table-row>
        <sui-table-header-cell>Anime</sui-table-header-cell>
        <sui-table-header-cell v-for="user of users" collapsing textAlign="right">
          <a v-bind:href="`https://anilist.co/user/${user.name}`" target="_blank">
            <sui-image
              rounded size="mini"
              :src="user.avatar.medium"
              :title="user.name"
            />
          </a>
        </sui-table-header-cell>
        <sui-table-header-cell collapsing textAlign="right">
          Latest
        </sui-table-header-cell>
        <sui-table-header-cell class="collapsing select-shows">
          <div class="animate">Show <br> / Hide</div>
        </sui-table-header-cell>
      </sui-table-row>
    </sui-table-header>

    <sui-table-body>
      <sui-table-row v-for="entry of filteredEntries"
        :key="entry.media.id"
        class="entry"
        v-bind:class="{ 'hide-entry': !entry.media.visible }"
      >
        <sui-table-header-cell class="title"
          :positive="entry.media.status === 'RELEASING'"
          :class="{ finished: entry.media.status === 'FINISHED' }"
          :title="entry.media.status === 'RELEASING' ? 'Releasing' : ''"
        >
          <div class="animate">
            <a v-bind:href="`https://anilist.co/anime/${entry.media.id}`" target="_blank">
              {{ entry.media.title.userPreferred }}
            </a>
          </div>
        </sui-table-header-cell>
        <sui-table-cell v-for="user of users"
          v-if="entry.users.has(user.name)"
          class="episode progress right aligned collapsing"
          v-bind:class="{paused: entry.users.get(user.name).status === 'PAUSED',
                         negative: entry.users.get(user.name).progress !== entry.maxEpisode }"
          v-bind:title="entry.users.get(user.name).score + ' / 10'"
        >
          <div class="animate">
            {{ entry.users.get(user.name).progress || "" }}
          </div>
        </sui-table-cell>
        <sui-table-cell v-else></sui-table-cell>
        <sui-table-cell class="episode latest right aligned collapsing"
            v-bind:class="{ positive: entry.maxEpisode !== entry.media.latestEpisode }">
          <div class="animate">
            {{ entry.media.latestEpisode }}
          </div>
        </sui-table-cell>
        <sui-table-header-cell class="collapsing select-shows">
          <sui-checkbox toggle v-model="entry.media.visible" class="animate"/>
        </sui-table-header-cell>
      </sui-table-row>
    </sui-table-body>

    <sui-table-footer class="full-width">
      <sui-table-header-cell v-bind:colspan="3 + users.length">
        <sui-button compact size="small" floated="right"
          :primary="hideSelectActive"
          @click="toggleHiddenEntries"
        >
          {{ hideSelectActive
             ? "Hide shows"
             : "Select shows" }}
        </sui-button>
        <span class="stats">
          {{ stats.count }} {{ (users.length > 1) ? "shared" : "" }} anime
          {{ stats.countReleasing > 0 ? `, ${stats.countReleasing} releasing` : "" }}
          {{ stats.hidden > 0 ? `, ${stats.hidden} hidden` : "" }}
          {{ stats.belowThreshold > 0 ? `, ${stats.belowThreshold} below threshold` : "" }}
        </span>
      </sui-table-header-cell>
    </sui-table-footer>
  </sui-table>
</template>

<script>

export default {
  props: {
    entries: Array,
    users: Array,
    minShared: String,
  },
  data () {
    return {
      hideSelectActive: false,
    }
  },
  computed: {
    /**
     * Statistics to be rendered in footer.
     * @return {Object}
     */
    stats () {
      const visibleEntries = this.filteredEntries.filter(({media}) => media.visible)
      return {
        count: visibleEntries.length,
        countReleasing: visibleEntries
          .filter(({media}) => media.status === 'RELEASING').length,
        hidden: this.filteredEntries.length - visibleEntries.length,
        belowThreshold: this.entries.length - this.filteredEntries.length,
      }
    },
    /**
     * Filter entries based on criteria (but do not hide).
     * @return {Object}
     */
    filteredEntries () {
      const dstEntries = []
      for (const entry of this.entries) {
        if (this.users.length === 1 || entry.users.size >= Number(this.minShared)) {
          dstEntries.push(entry)
        }
      }
      return dstEntries
    },
  },
  methods: {
    toggleHiddenEntries () {
      this.hideSelectActive = !this.hideSelectActive

      if (!this.hideSelectActive) {
        const hiddenEntries = this.entries
          .filter(({media}) => !media.visible)
          .map(({media}) => media.id)
        this.$emit('updateHidden', hiddenEntries)
      }
    },
  },
}
</script>

<style type="text/css" scoped>
  /*** Misc formatting ***/
  th.title.positive a {
    color: hsl(93, 72%, 25%);
  }

  /*** Sticky table head ***/
  /* Must be on th because of chrome (and edge) bug
   * https://caniuse.com/#feat=css-sticky
   */
  thead th {
    position: sticky;
    top: 0;
    z-index: 5;
  }
  thead th:first-child {
    /* Otherwise background is transparent */
    background: white;
  }

  /*** Hiding and showing entries ***/
  .select-shows, .select-shows *,
  .hide-entry > * {
    transition: 0.5s;
  }
  .entry-table:not(.editing) .select-shows {
    padding-left: 0;
    padding-right: 0;
    border-width: 0;
  }
  .entry-table:not(.editing) .select-shows * { /* this selector is not optimal, but ┐(°ヮ°)┌ */
    transform: scaleX(0);
    width: 0;
    /*padding: 0;*/
    font-size: 0;
    min-width: 0;
  }
  /*.entry-table:not(.editing) .hide-entry .animate {*/
  .entry-table:not(.editing) .hide-entry > *,
  .entry-table:not(.editing) .hide-entry .animate {
    /*transform: scaleY(0);*/
    height: 0;
    min-height: 0;
    padding-top: 0;
    padding-bottom: 0;
    border-width: 0;
    font-size: 0;
    line-height: 0;
  }
</style>
