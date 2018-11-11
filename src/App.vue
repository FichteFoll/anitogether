<template>
  <div id="app">
    <div id="container">
      <sui-form id="input-form">
        <sui-header sub>Users</sui-header>
        <UsersInput
          v-model="usersInput"
          :userHistory="userHistory"
          @clearHistory="clearUserHistory"
        />

        <sui-header sub>Settings</sui-header>
        <Settings
          :titleFormat="titleFormat"
          @inputFormat="titleFormat = $event"
          :minShared="minShared"
          @inputShared="minShared = $event"
        />
      </sui-form>

      <sui-divider />

      <Messages
        :messages="messages"
        @dismiss="dismissMessage"
      />

      <EntryList
        :entries="entries"
        :users="orderedUsers"
        :minShared="minShared"
        @updateHidden="hiddenEntries = $event"
      />

      <footer>
        Made by <a href="https://github.com/FichteFoll" target="_blank">FichteFoll</a>;
        Open Source @
        <a href="https://github.com/FichteFoll/anitogether" target="_blank">
          <sui-icon name="github" /> GitHub
        </a>
      </footer>
    </div>
  </div>
</template>

<script>
import Vue from 'vue'
import EntryList from './components/EntryList.vue'
import Messages from './components/Messages.vue'
import Settings from './components/Settings.vue'
import UsersInput from './components/UsersInput.vue'

import {getMediaLists} from './query.js'

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

// Default parameters
const defaults = {
  format: "romaji",
  minShared: "2",
  users: "",
  hide: "",
}

export default {
  components: {
    EntryList,
    Messages,
    Settings,
    UsersInput,
  },
  data () {
    return {
      // would like to use Maps, but Vue doesn't support those in v-for
      // https://github.com/vuejs/vue/issues/2410
      sourceEntries: {},
      users: {},
      usersInput: [],
      userHistory: [],
      titleFormat: defaults.format,
      minShared: defaults.minShared,
      hiddenEntries: [],
      messages: [],
      // Use this to track whether hash needs to change
      // (and when we should add an entry to the history)
      oldParams: {},
    }
  },
  created () {
    try {
      const storageHistory = localStorage.getItem('userHistory') || ""
      if (storageHistory !== "") {
        this.userHistory = storageHistory.split(',')
      }
    } catch (e) {
      console.warn("Unable to access localStorage")
    }
    this.loadHash()
    window.addEventListener('hashchange', this.loadHash)
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
    /**
     * Order users in entries by user input.
     * @return {Array[Object]} Sorted user objects.
     */
    orderedUsers () {
      const orderedUsers = []
      for (const name of this.usersInput) {
        if (this.users[name]) {
          orderedUsers.push(this.users[name])
        }
      }
      return orderedUsers
    },
  },
  watch: {
    userHistory () {
      try {
        localStorage.setItem('userHistory', this.userHistory.join(','))
      } catch (e) {
        console.warn("Unable to set localStorage")
      }
    },
    minShared () { this.updateLocation() },
    usersInput () { this.updateLocation(); this.fetchLists() },
    titleFormat () { this.updateLocation() },
    hiddenEntries () { this.updateLocation() },
  },
  methods: {
    fetchLists () {
      const userNames = this.usersInput
      if (userNames.length === 0) return

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
        .catch((error) => {
          if (error instanceof Error) {
            this.showMessage(error.message)
          } else if (error.errors) { // actually payload
            for (const {message} of error.errors) {
              this.showMessage("error", message)
            }
          } else {
            console.error("fetch error", error)
          }
        })
    },
    /**
     * Update userHistory and prevent duplicates (by using a Set).
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
    getMediaTitle (media) {
      // english and native may be null, so always fall back to romaji
      return media.title[this.titleFormat] || media.title.romaji
    },
    loadHash () {
      console.log("loading hash")
      const updateIfChanged = (prop, value) => {
        // don't update props unnecessarily
        const oldValue = this[prop]
        if (JSON.stringify(oldValue) !== JSON.stringify(value)) {
          this[prop] = value
          console.log("setting", prop, value)
          // this.$set(this, prop, value)
          return true
        }
        return false
      }

      const hash2Obj = location.hash.substring(1)
        .split("&")
        .map(v => v.split("="))
        .reduce(
          (pre, [key, value]) => ({ ...pre, [key]: decodeURIComponent(value) }),
          {}
        )
      const params = {...defaults, ...hash2Obj}

      // Set data
      if (!updateIfChanged('oldParams', params)) return // short-circuit
      updateIfChanged('usersInput', sanitizeInput(params.users))
      updateIfChanged('titleFormat', params.format)
      updateIfChanged('minShared', params.minShared)
      updateIfChanged('hiddenEntries', sanitizeInput(params.hide).map(Number))
    },
    /**
     * Update location hash parameters.
     */
    updateLocation () {
      const params = {
        users: this.usersInput.join(","),
        format: this.titleFormat,
        minShared: this.minShared,
        hide: this.hiddenEntries.join(","),
      }
      const replaceFor = new Set(["users"])

      const hash = "#" + Object.entries(params)
        .filter(([k, v]) => v != defaults[k])
        .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
        .join('&')
      const newUrl = location.origin + location.pathname + location.search + hash

      const shouldReplace = Object.entries(params)
        .filter(([k, v]) => v != this.oldParams[k])
        .every(([k]) => replaceFor.has(k))

      if (shouldReplace) {
        location.assign(newUrl)
      } else {
        location.replace(newUrl)
      }

      this.oldParams = params
    },
    /**
     * Render a message in the html.
     * @param  {String} kind  One of "error", "warning", "info", "positive".
     * @param  {[type]} text  (optional)
     * @param  {[type]} title (optional)
     */
    showMessage (kind, text, title) {
      if (!text || text === "") return
      for (const message of this.messages) {
        if (message.text === text) {
          message.count += 1
          return
        }
      }
      this.messages.push({kind, text, title, count: 1})
    },
    dismissMessage (index) {
      this.messages.splice(index, 1)
    },
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
