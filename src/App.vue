<template>
  <div id="app">
    <div id="container">
      <sui-form id="input-form">
        <sui-header sub>Users</sui-header>
        <UsersInput
          v-model="usersInput"
          :userHistory="userHistory"
        />

        <sui-header sub>Settings</sui-header>
        <Settings
          :titleFormat="titleFormat"
          @inputFormat="titleFormat = $event"
          :minShared="minShared"
          @inputMinShared="minShared = $event"
          :allShared="allShared"
          @inputAllShared="allShared = $event"
          @clearHistory="clearUserHistory"
          :hideSeen="hideSeen"
          @inputHideSeen="hideSeen = $event"
          :dark="dark"
          @inputDark="dark = $event"
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
        :hideSeen="hideSeen"
        :allShared="allShared"
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


const LIGHT_PATH = "light.html"

/**
 * Split a string by comma and remove duplicates.
 * @param  {String} inputString The string to split.
 * @return {Array}              Disjoined elements of the string.
 */
function sanitizeInput (inputString) {
  const inputArray = inputString.split(",").map(x => x.trim())
  const inputSet = new Set(inputArray)
  inputSet.delete("")
  return [...inputSet]
}

// Default parameters
const defaults = {
  users: [],
  format: "romaji",
  minShared: 2,
  hideSeen: true,
  all: false,
  hide: [],
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
      cache: {},
      sourceEntries: {},
      users: {},
      usersInput: [],
      userHistory: [],
      titleFormat: defaults.format,
      minShared: defaults.minShared,
      allShared: defaults.all,
      hiddenEntries: [],
      hideSeen: defaults.hideSeen,
      dark: !location.pathname.endsWith(LIGHT_PATH),
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
      localStorage.removeItem('dark')
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
        const mUsers = [...entry.users.values()]
        entry.maxEpisode = Math.max(...mUsers.map(e => e.progress))
        entry.media.visible = this.hiddenEntries.indexOf(entry.media.id) === -1
        entry.media.title.userPreferred = this.getMediaTitle(entry.media)
      }

      // Build sorted Array
      const ret = [...dstEntries.values()]
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
    hideSeen () { this.updateLocation() },
    allShared () { this.updateLocation() },
    dark () { this.updateLocation() },
  },
  methods: {
    fetchLists () {
      const userNames = this.usersInput
      if (userNames.length === 0) return
      this.updateUserHistory(userNames)

      const knownUsers = new Set(Object.keys(this.cache))
      const unknownUsers = userNames.filter(name => !knownUsers.has(name))
      if (unknownUsers.length === 0) {
        this.finalizeUpdate()
        return
      }

      console.log("fetching info for", unknownUsers)
      // Could show a loading icon here,
      // but responses are so fast it doesn't matter.
      getMediaLists(unknownUsers, "CURRENT")
        .then((json) => {
          console.log("results for users", unknownUsers, json)
          for (const collection of Object.values(json.data)) {
            const user = collection.user
            // Custom lists cause us to collect duplicates,
            // but the computed `entries` prop doesn't care about them.
            const entries = collection.lists.reduce(
              (sum, x) => sum.concat(x.entries),
              []
            )
            if (entries.length === 0) {
              this.showMessage("warning", `${user.name}'s list is empty`)
              continue
            }
            Vue.set(this.cache, user.name, [user, entries])
          }
          this.finalizeUpdate()
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
    finalizeUpdate () {
      const sourceEntries = {}
      const users = {}
      for (const name of this.usersInput) {
        const [user, entries] = this.cache[name]
        sourceEntries[name] = entries
        users[name] = user
      }
      this.sourceEntries = sourceEntries
      this.users = users
      // https://stackoverflow.com/questions/36612847/how-can-i-bind-the-html-title-content-in-vuejs
      document.title = `AniTogether - ${this.usersInput.join(", ")}`
      console.log("update done for", this.usersInput)
    },
    /**
     * Update userHistory and prevent duplicates (by using a Set).
     * @param  {Array} userNames Names to add.
     */
    updateUserHistory (userNames) {
      const userSet = new Set([...this.userHistory, ...userNames])
      const userArray = [...userSet]
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
      const updateIfChanged = (prop, value) => {
        // don't update props unnecessarily
        const oldValue = this[prop]
        if (JSON.stringify(oldValue) !== JSON.stringify(value)) {
          this[prop] = value
          return true
        }
        return false
      }

      const inputParsers = {
        users: sanitizeInput,
        // format: (x) => x,
        minShared: Number,
        hideSeen: (x) => x == 'true',
        all: (x) => x == 'true',
        hide: (x) => sanitizeInput(x).map(Number),
      }

      const hash2Obj = location.hash.substring(1)
        .split("&")
        .filter((x) => x !== "")
        .reduce((acc, elem) => {
            const [key, input] = elem.split("=")
            const parser = inputParsers[key] || ((x) => x)
            acc[key] = parser(decodeURIComponent(input))
            return acc
          },
          {}
        )
      const params = {...defaults, ...hash2Obj}

      // Set data
      if (!updateIfChanged('oldParams', params)) return // short-circuit
      // TODO this causes updateLocation to be called 4 times on first load
      updateIfChanged('usersInput', params.users)
      updateIfChanged('titleFormat', params.format)
      updateIfChanged('minShared', params.minShared)
      updateIfChanged('hideSeen', params.hideSeen)
      updateIfChanged('allShared', params.all)
      updateIfChanged('hiddenEntries', params.hide)
    },
    /**
     * Update location hash parameters.
     */
    updateLocation () {
      const params = {
        // Must keep same order as defaults, so we use rest spread
        ...defaults,
        users: this.usersInput.join(","),
        format: this.titleFormat,
        minShared: this.minShared,
        hideSeen: this.hideSeen,
        all: this.allShared,
        hide: this.hiddenEntries.join(","),
      }
      const replaceFor = new Set(["users"])

      const hash = "#" + Object.entries(params)
        .filter(([k, v]) => v != defaults[k])
        .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
        .join('&')

      let shouldReplace = Object.entries(params)
        .filter(([k, v]) => v != this.oldParams[k])
        .every(([k]) => replaceFor.has(k))

      let newPath = location.pathname
      if (newPath.endsWith(LIGHT_PATH) && this.dark) {
        newPath = newPath.substring(0, newPath.length - LIGHT_PATH.length)
        shouldReplace = false
      }
      else if (!newPath.endsWith(LIGHT_PATH) && !this.dark) {
        newPath += LIGHT_PATH
        shouldReplace = false
      }

      const newUrl = location.origin + newPath + location.search + hash
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

<style lang="sass">
  #app
    margin: 2em

  #container
    max-width: 800px
    margin: auto

  footer
    text-align: right
</style>
