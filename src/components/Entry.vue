<template>
    <sui-table-row
      class="entry"
    >
      <sui-table-header-cell class="title"
        :positive="entry.media.status === 'RELEASING'"
        :title="entry.media.status === 'RELEASING' ? 'Releasing' : ''"
      >
        <transition name="title" mode="out-in">
          <div class="animate" :key="entry.media.title.userPreferred">
            <a
              v-bind:href="`https://anilist.co/anime/${entry.media.id}`"
              target="_blank"
            >
              {{ entry.media.title.userPreferred }}
            </a>
          </div>
        </transition>
      </sui-table-header-cell>

      <sui-table-cell v-for="user of users"
        :key="user.name"
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

      <sui-table-cell
        class="episode latest right aligned collapsing"
        v-bind:class="{ positive: entry.maxEpisode !== entry.media.latestEpisode }"
      >
        <div class="animate">
          {{ entry.media.latestEpisode }}
        </div>
      </sui-table-cell>

      <sui-table-header-cell class="collapsing select-shows">
        <div class="animate">
          <sui-checkbox toggle v-model="entry.media.visible" />
        </div>
      </sui-table-header-cell>
    </sui-table-row>
</template>

<script>

export default {
  props: {
    entry: Object,
    users: Array,
    hideSelectActive: Boolean,
  },
}
</script>

<style type="text/css" scoped>
  .title.positive a {
    color: hsl(93, 72%, 25%);
  }

  .animate .checkbox.toggle {
    display: block;
    min-height: 0;
  }

  /*** Switching title format ***/
  .title-enter-active, .title-leave-active {
    transition: all 0.2s;
  }
  .title-enter {
    transform: translateX(2em);
    opacity: 0;
  }
  .title-leave-to {
    transform: translateX(-2em);
    opacity: 0;
  }


  /*** Fading table row components ***/
  /* Reset padding on cells because we can't animate that */
  .ui.compact.table .entry td,
  .ui.compact.table .entry th {
    padding: 0;
  }

  .entry .animate {
    padding: .5em .7em;
    transition: all 0.5s;
  }

  .rowfade-enter .animate, .rowfade-leave-to .animate {
    /*height: 0px;*/
    min-height: 0px;
    padding-top: 0;
    padding-bottom: 0;
    border-width: 0px;
    line-height: 0px; /* unit is required */
  }
  /* WHY DOES THIS NOT MATCH IM FUCKING LOSING IT */
  .animate .checkbox.toggle /deep/ label,
  .rowfade-enter .animate .checkbox.toggle /deep/ label,
  .rowfade-leave-to .animate .checkbox.toggle /deep/ label, {
    min-height: 0rem;
  }
  .animate .checkbox.toggle {
    display: block;
    min-height: 0;
  }
</style>
