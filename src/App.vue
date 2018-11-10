<template>
  <div id="app" class="center aligned">
    <div id="container" class="center aligned">
      <div id="input-container">
        <div class="ui sub header">Users</div>
        <div id="user-dropdown" class="ui fluid multiple search selection dropdown action">
          <input name="users" type="hidden"
              v-model.lazy="usersInput"
              @change="fetchLists">
          <i class="dropdown icon"></i>
          <div class="default text">Search users…</div>
          <div class="menu">
            <div v-for="name of userHistory"
                class="item"
                v-bind:data-value="name">
              {{ name }}
            </div>
            <div class="divider"></div>
            <div class="header">
              <button class="ui button tiny labeled icon compact"
                  @click="clearUserHistory">
                <i class="icon delete"></i>
                Clear history
              </button>
            </div>
            <!-- TODO search results from anilist? -->
          </div>
        </div>

        <div class="ui sub header">Settings</div>
        <div class="ui form">
          <div class="fields">
            <div class="field inline fields">
              <label for="format">Title Format:</label>
              <div class="field">
                <div class="ui radio checkbox">
                  <input type="radio" name="format" value="romaji" v-model="titleFormat">
                  <label>Romaji</label>
                </div>
              </div>
              <div class="field">
                <div class="ui radio checkbox">
                  <input type="radio" name="format" value="english" v-model="titleFormat">
                  <label>English</label>
                </div>
              </div>
              <div class="field">
                <div class="ui radio checkbox">
                  <input type="radio" name="format" value="native" v-model="titleFormat">
                  <label>Native</label>
                </div>
              </div>
            </div>
            <div class="field fields ui input inline">
              <label>Minimum users for shared anime</label>
              <input type="number" name="minShared" v-model="minShared" class="one wide">
            </div>
          </div>
        </div>
      </div>

      <div class="ui dividing header"></div>

      <div id="messages"></div>

      <EntryList :entries="entries" :users="orderedUsers" />

      <footer>
        Made by <a href="https://github.com/FichteFoll" target="_blank">FichteFoll</a>;
        Open Source @ <a href="https://github.com/FichteFoll/anitogether" target="_blank">
          <i class="icon github"></i> GitHub
        </a>
      </footer>
    </div>
  </div>
</template>

<script>
import Vue from 'vue'
import {getMediaLists} from './query.js'
import EntryList from './components/EntryList.vue'

/**
 * Split a string by comma and remove duplicates.
 * @param  {String} inputString The string to split.
 * @return {Array}              Disjoined elements of the string.
 */
function sanitizeInput (inputString) {
  const inputArray = inputString.split(",").map(x => x.trim())
  const inputSet = new Set(inputArray)
  inputSet.delete("")
  return Array.from(inputSet)
}

// Parse params and merge with defaults
const defaults = {
  format: "romaji",
  minShared: 2,
  users: "",
  hide: "",
}

const hash2Obj = location.hash.substring(1)
  .split("&")
  .map(v => v.split("="))
  .reduce(
    (pre, [key, value]) => ({ ...pre, [key]: decodeURIComponent(value) }),
    {}
  )

// Interpret params
let oldParams = {...defaults, ...hash2Obj}
let oldUserHistory = []
try {
  const storageHistory = localStorage.getItem('userHistory') || ""
  if (storageHistory !== "") {
    oldUserHistory = storageHistory.split(',')
  }
} catch (e) {
  console.log("Unable to access localStorage")
}

// State tracking
let lastUserList = []


export default {
  name: 'app',
  components: {
    EntryList,
  },
  data () {
    return {
      // would like to use Maps, but Vue doesn't support those in v-for
      // https://github.com/vuejs/vue/issues/2410
      sourceEntries: {},
      users: {},
      usersInput: "",  // set this later
      userHistory: oldUserHistory,
      titleFormat: oldParams.format,
      minShared: oldParams.minShared,
      hiddenEntries: sanitizeInput(oldParams.hide).map(Number),
      booleans: { // Vue can't track raw booleans it seems?
        disabled: true,
      },
    }
  },
  computed: {
    entries () {
      const dstEntries = new Map()
      for (const [userName, srcEntries] of Object.entries(this.sourceEntries)) {
        for (const {media, ...rest} of srcEntries) {
          if (!dstEntries.has(media.id)) {
            if (!media.latestEpisode) {
              media.latestEpisode
                = media.nextAiringEpisode && media.nextAiringEpisode.episode > 0
                  ? media.nextAiringEpisode.episode - 1
                  : media.episodes || "?"
            }
            dstEntries.set(media.id, {media, users: new Map()})
          }
          dstEntries.get(media.id).users.set(userName, rest)
        }
      }

      // Compute some props on entries
      for (const entry of dstEntries.values()) {
        const mUsers = Array.from(entry.users.values())
        entry.maxEpisode = Math.max(...mUsers.map(e => e.progress))
        entry.media.visible = this.hiddenEntries.indexOf(entry.media.id) === -1
        entry.media.title.userPreferred = this.getMediaTitle(entry.media)
      }

      // Build sorted Array
      const ret = Array.from(dstEntries.values())
      ret.sort((a, b) => a.media.title.userPreferred.localeCompare(b.media.title.userPreferred, "ja"))
      return ret
    },
    usersInputList () {
      return sanitizeInput(this.usersInput)
    },
    /**
     * Order users in entries by user input.
     * @return {Array[Object]} Sorted user objects.
     */
    orderedUsers () {
      const orderedUsers = []
      for (const name of this.usersInputList) {
        if (this.users[name]) {
          orderedUsers.push(this.users[name])
        }
      }
      return orderedUsers
    },
  },
  created () {
    this.fetchLists()
  },
  watch: {
    userHistory () {
      setTimeout(() => {
        // Delay execution so the DOM is changed
        // before we ask the dropdown to refresh the selected items.
        try {
          localStorage.setItem('userHistory', this.userHistory.join(','))
        } catch (e) {
          console.log("Unable to set localStorage")
        }
        this.setDropdownItems(this.usersInputList)
      })
    },
    minShared () { this.updateLocation() },
    usersInputList () { this.updateLocation() },
    titleFormat () { this.updateLocation() },
    hiddenEntries () { this.updateLocation() },
  },
  methods: {
    fetchLists () {
      if (this.booleans.disabled) return
      const userNames = this.usersInputList
      if (userNames.length === 0) return
      if (userNames.toString() === lastUserList.toString()) return
      lastUserList = userNames

      console.log("fetching for", userNames)
      document.title = `AniTogether - ${userNames.join(", ")}`
      // https://stackoverflow.com/questions/36612847/how-can-i-bind-the-html-title-content-in-vuejs
      this.updateUserHistory(userNames)

      // Could show a loading icon here,
      // but responses are so fast it doesn't matter.
      getMediaLists(userNames, "CURRENT")
        .then((json) => {
          console.log("results for users", userNames, json)
          this.sourceEntries = {}
          this.users = {}
          for (const collection of Object.values(json.data)) {
            // discard custom lists as they have duplicates
            const user = collection.user
            const entries = collection.lists.reduce(
              (sum, x) => !x.isCustomList ? sum.concat(x.entries) : sum,
              []
            )
            if (entries.length === 0) {
              this.showMessage("warning", `${user.name}'s list is empty`)
              continue
            }
            Vue.set(this.sourceEntries, user.name, entries)
            Vue.set(this.users, user.name, user)
          }
        })
        .catch((json) => {
          for (const {message} of json.errors) {
            this.showMessage("error", message)
          }
          console.error("fetch error", json)
        })
    },
    /**
     * Update userHistory in localStorage.
     * @param  {Array} userNames Names to add.
     */
    updateUserHistory (userNames) {
      const userSet = new Set([...this.userHistory, ...userNames])
      const userArray = Array.from(userSet)
      userArray.sort((a, b) => a.localeCompare(b))
      if (this.userHistory.toString() !== userArray.toString()) {
        this.userHistory = userArray
      }
    },
    clearUserHistory () {
      this.userHistory = []
    },
    toggleEntry (id) {
      console.log(id)
    },
    getMediaTitle (media) {
      // english and native may be null, so always fall back to romaji
      return media.title[this.titleFormat] || media.title.romaji
    },
    /**
     * Set selected items in dropdown list.
     * Needed to preserve order because directly setting the input
     * loops over the wrong list first.
     * See https://github.com/Semantic-Org/Semantic-UI/issues/3841.
     *
     * @param {Array} items Items to set (user names).
     */
    setDropdownItems (items) {
      this.booleans.disabled = true
      $('.dropdown').dropdown('set selected', items)
      this.booleans.disabled = false
      this.fetchLists()
    },
    /**
     * Update location hash parameters.
     */
    updateLocation () {
      const params = {
        users: this.usersInputList.join(","),
        format: this.titleFormat,
        minShared: this.minShared,
        hide: this.hiddenEntries.join(","),
      }
      const changeFor = new Set(["users"])

      const hash = "#" + Object.entries(params)
        .filter(([k, v]) => v != defaults[k])
        .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
        .join('&')
      const newUrl = location.origin + location.pathname + location.search + hash

      const shouldChange = Object.entries(params)
        .filter(([k, v]) => v != oldParams[k])
        .every(([k]) => changeFor.has(k))

      if (shouldChange) {
        location.assign(newUrl)
      } else {
        location.replace(newUrl)
      }

      oldParams = params
    },
    /**
     * Rener a message in the html.
     * @param  {String} kind  One of "error", "warning", "info", "positive".
     * @param  {[type]} text  (optional)
     * @param  {[type]} title (optional)
     */
    showMessage (kind, text, title) {
      const msgContainer = document.getElementById("messages")

      // Check for existing message with same text and append a counter
      for (const {lastChild: textNode} of msgContainer.querySelectorAll(".message.visible")) {
        let oldText = textNode.textContent
        if (oldText.includes(text.trim())) {
          let num = 2
          const match = /\((\d+)\)$/.exec(textNode.textContent)
          if (match) {
            oldText = oldText.substring(0, match.index)
            num = Number(match[1]) + 1
          }
          textNode.textContent = `${oldText} (${num})`
          return
        }
      }

      const cls = kind === 'error' ? 'negative' : kind
      const html = `
        <div class="ui message ${cls} hidden">
          <i class="close icon"></i>
          <div class="header">${title || ""}</div>
          ${text || ""}
        </div>
      `
      msgContainer.insertAdjacentHTML('beforeend', html)
      const $msg = $("#messages .message:last-child")
      $msg.find('.close').on('click', () => $msg.transition('fade'))
      $msg.transition('fade')
    },
  },
  mounted () {
    $('.ui.radio.checkbox')
      .checkbox()
    $('#user-dropdown')
      .dropdown({
        allowAdditions: true,
        clearable: true,
        sortSelect: true,
      })
    this.setDropdownItems(sanitizeInput(oldParams.users))
  },
}
</script>

<style>
  #app {
    margin: 2em;
  }

  #container {
    max-width: 800px;
    margin: auto;
  }

  footer {
    text-align: right;
  }
</style>
