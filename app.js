/* global Vue:false, $:false, getMediaLists:false */
'use strict'

const defaults = {
  format: "romaji",
  minShared: 2,
  users: "",
}

const hash2Obj = location.hash.substring(1)
  .split("&")
  .map(v => v.split("="))
  .reduce(
    (pre, [key, value]) => ({ ...pre, [key]: decodeURIComponent(value) }),
    {}
  )

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

let lastUserList = []

const app = new Vue({
  el: '#app',
  data: {
    // would like to use Maps, but Vue doesn't support those in v-for
    // https://github.com/vuejs/vue/issues/2410
    sourceEntries: {},
    users: {},
    usersInput: "",  // set this later
    userHistory: oldUserHistory,
    titleFormat: oldParams.format,
    disabled: true,
    minShared: oldParams.minShared,
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

      // filter based on criteria
      for (const [key, entry] of dstEntries.entries()) {
        if (this.usersInputList.length > 1 && entry.users.size < this.minShared) {
          dstEntries.delete(key)
        }
      }

      for (const entry of dstEntries.values()) {
        const mUsers = Array.from(entry.users.values())
        entry.maxEpisode = Math.max(...mUsers.map(e => e.progress))
      }

      const ret = Array.from(dstEntries.values())
      ret.sort((a, b) => a.media.title.userPreferred.localeCompare(b.media.title.userPreferred))
      return ret
    },
    usersInputList () {
      return this.sanitizeInput(this.usersInput)
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
        app.setDropdownItems(this.usersInputList)
      })
    },
    minShared () { this.updateLocation() },
    usersInputList () { this.updateLocation() },
    titleFormat () { this.updateLocation() },
  },
  methods: {
    fetchLists () {
      if (this.disabled) return
      const userNames = this.usersInputList
      if (userNames.length === 0) return
      if (userNames.toString() === lastUserList.toString()) return
      lastUserList = userNames

      console.log("fetching for", userNames)
      document.title = `AniTogether - ${userNames.join(", ")}`
      // https://stackoverflow.com/questions/36612847/how-can-i-bind-the-html-title-content-in-vuejs
      this.updateUserHistory(userNames)

      // TODO add and remove loading icon
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
              // TODO warn visibly
              console.warn(`List for ${user.name} is empty!`)
              return
            }
            Vue.set(this.sourceEntries, user.name, entries)
            Vue.set(this.users, user.name, user)
          }
        })
        .catch((error) => {
          // TODO display errors
          alert('Error, check console')
          console.error(error)
        })
    },
    /**
     * Split a string by comma and remove duplicates.
     * @param  {String} inputString The string to split.
     * @return {Array}              Disjoined elements of the string.
     */
    sanitizeInput (inputString) {
      const inputArray = inputString.split(",").map(x => x.trim())
      const inputSet = new Set(inputArray)
      inputSet.delete("")
      return Array.from(inputSet)
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
      app.disabled = true
      $('.dropdown').dropdown('set selected', items)
      app.disabled = false // dunno why this doesn't trigger fetchLists
      app.fetchLists()
    },
    /**
     * Update location hash parameters.
     */
    updateLocation () {
      const params = {
        users: this.usersInputList.join(","),
        format: this.titleFormat,
        minShared: this.minShared,
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
  },
})

$('.ui.radio.checkbox')
  .checkbox()
$('#user-dropdown')
  .dropdown({
    allowAdditions: true,
    clearable: true,
    sortSelect: true,
  })
app.setDropdownItems(app.sanitizeInput(oldParams.users))
