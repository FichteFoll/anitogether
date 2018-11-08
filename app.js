const hash2Obj = location.hash.substring(1)
      .split("&")
      .map(v => v.split("="))
      .reduce( (pre, [key, value]) => ({ ...pre, [key]: value }), {} )

let oldUserHistory = []
try {
  const storageHistory = localStorage.getItem('userHistory') || ""
  if (storageHistory !== "") {
    oldUserHistory = storageHistory.split(',')
  }
} catch (e) {}

const app = new Vue({
  el: '#app',
  data: {
    // would like to use Maps, but Vue doesn't support those in v-for
    // https://github.com/vuejs/vue/issues/2410
    sourceEntries: {},
    users: {},
    usersInput: hash2Obj.users || "",
    userHistory: oldUserHistory,
  },
  computed: {
    entries () {
      let dstEntries = new Map()
      for (const [userName, srcEntries] of Object.entries(this.sourceEntries)) {
        for (const {media, ...rest} of srcEntries) {
          if (!dstEntries.has(media.id)) {
            if (!media.latestEpisode) {
              media.latestEpisode =
                (media.nextAiringEpisode && media.nextAiringEpisode.episode > 0)
                ? media.nextAiringEpisode.episode - 1
                : (media.episodes || "?")
            }
            dstEntries.set(media.id, {media: media, users: new Map()})
          }
          dstEntries.get(media.id).users.set(userName, rest)
        }
      }
      for (let entry of dstEntries.values()) {
        const mUsers = Array.from(entry.users.values())
        entry.maxEpisode = Math.max(...mUsers.map(e => e.progress))
      }

      let ret = Array.from(dstEntries.values())
      ret.sort((a, b) => {
        return a.media.title.userPreferred.localeCompare(b.media.title.userPreferred)
      })
      return ret
    },
    sortedUsers () {
      let userList = Array.from(Object.values(this.users))
      userList.sort((a, b) => {
        return a.name.localeCompare(b.name)
      })
      return userList
    },
  },
  created () {
    this.fetchLists()
  },
  watch: {
    userHistory() {
      try {
        localStorage.setItem('userHistory', this.userHistory.join(','))
      } catch (e) {}
    }
  },
  methods: {
    fetchLists () {
      // TODO sanitize input (and set back)
      console.log("fetching with", this.usersInput)
      const userNames = this.sanitizeInput(this.usersInput)
      if (userNames.length === 0) return;
      location.assign(location.origin + location.pathname + location.search
                      + "#users=" + userNames.join(","))
      document.title = `AniTogether - ${userNames.join(", ")}`
      // https://stackoverflow.com/questions/36612847/how-can-i-bind-the-html-title-content-in-vuejs
      this.updateUserHistory(userNames)

      // TODO add and remove loading icon
      getMediaLists(userNames, "CURRENT")
        // TODO handle errors
        .then(json => {
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
    },
    /**
     * Split a string by comma and remove duplicates.
     * @param  {String} inputString The string to split.
     * @return {Array}              Disjoined elements of the string.
     */
    sanitizeInput (inputString) {
      const inputArray = inputString.split(",").map(x => x.trim())
      let inputSet = new Set(inputArray)
      inputSet.delete("")
      return Array.from(inputSet)
    },
    /**
     * Update userHistor in localStorage.
     * @param  {Array} userNames Names to add.
     */
    updateUserHistory (userNames) {
      const userSet = new Set([...this.userHistory, ...userNames])
      let userArray = Array.from(userSet)
      userArray.sort((a, b) => {
        return a.localeCompare(b)
      })
      this.userHistory = userArray
    },
  },
})


$('#user-dropdown')
  .dropdown({
    allowAdditions: true
  })
