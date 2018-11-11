<template>
  <!-- Need to wrap all table cells I intend to animate in a div
    because you cannot override table row or cell sizes. -->
  <table id="table"
      class="ui table celled definition compact unstackable selectable"
      v-bind:class="{ editing: hideSelectActive }">
    <thead>
      <tr>
        <th>Anime</th>
        <th v-for="user of users"
            class="right aligned collapsing">
          <a v-bind:href="`https://anilist.co/user/${user.name}`" target="_blank">
            <img class="avatar"
                v-bind:src="user.avatar.medium"
                v-bind:title="user.name">
          </a>
        </th>
        <th class="right aligned collapsing">Latest</th>
        <th class="collapsing select-shows">
          <div class="animate">Show <br> / Hide</div>
        </th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="entry of filteredEntries"
          class="entry"
          v-bind:class="{ 'hide-entry': !entry.media.visible }">
        <th class="title"
            v-bind:class="{positive: entry.media.status === 'RELEASING',
                           finished: entry.media.status === 'FINISHED'}"
            v-bind:title="entry.media.status === 'RELEASING' ? 'Releasing' : ''">
          <div class="animate">
            <a v-bind:href="`https://anilist.co/anime/${entry.media.id}`" target="_blank">
              {{ entry.media.title.userPreferred }}
            </a>
          </div>
        </th>
        <td v-for="user of users"
            v-if="entry.users.has(user.name)"
            class="episode progress right aligned collapsing"
            v-bind:class="{paused: entry.users.get(user.name).status === 'PAUSED',
                           negative: entry.users.get(user.name).progress !== entry.maxEpisode }"
            v-bind:title="entry.users.get(user.name).score + ' / 10'">
          <div class="animate">
            {{ entry.users.get(user.name).progress || "" }}
          </div>
        </td>
        <td v-else></td>
        <td class="episode latest right aligned collapsing"
            v-bind:class="{ positive: entry.maxEpisode !== entry.media.latestEpisode }">
          <div class="animate">
            {{ entry.media.latestEpisode }}
          </div>
        </td>
        <th class="collapsing select-shows">
          <div class="ui fitted slider checkbox animate">
            <input type="checkbox"
                v-bind:value="entry.media.id" v-model="entry.media.visible">
            <label></label>
          </div>
        </th>
      </tr>
    </tbody>
    <tfoot class="full-width">
      <th v-bind:colspan="3 + users.length">
        <button class="ui button compact small right floated"
            v-bind:class="{ primary: hideSelectActive }"
            @click="toggleHiddenEntries">
          {{ hideSelectActive
             ? "Hide shows"
             : "Select shows" }}
        </button>
        {{ stats.count }} {{ (users.length > 1) ? "shared" : "" }} anime
        {{ stats.countReleasing > 0 ? `, ${stats.countReleasing} releasing` : "" }}
        {{ stats.hidden > 0 ? `, ${stats.hidden} hidden` : "" }}
        {{ stats.belowThreshold > 0 ? `, ${stats.belowThreshold} below threshold` : "" }}
      </th>
    </tfoot>
  </table>
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
      console.log("toggling", this.hideSelectActive)
      // $('.select-shows:not(.selected)').transition('fade left')

      if (!this.hideSelectActive) {
        this.hiddenEntries = this.entries
          .filter(({media}) => !media.visible)
          .map(({media}) => media.id)
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

  th .avatar {
    width: 32px;
    height: 32px;
    border-radius: 4px;
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
  #table:not(.editing) .select-shows {
    padding-left: 0;
    padding-right: 0;
    border-width: 0;
  }
  #table:not(.editing) .select-shows * { /* this selector is not optimal, but ┐(°ヮ°)┌ */
    transform: scaleX(0);
    width: 0;
    /*padding: 0;*/
    font-size: 0;
    min-width: 0;
  }
  /*#table:not(.editing) .hide-entry .animate {*/
  #table:not(.editing) .hide-entry > *,
  #table:not(.editing) .hide-entry .animate {
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
