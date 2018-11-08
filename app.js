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
    titleFormat: "romaji",
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
    usersInputList () {
      return this.sanitizeInput(this.usersInput)
    },
    /**
     * Order users in entries by user input.
     * @return {Array[Object]} Sorted user objects.
     */
    orderedUsers () {
      let orderedUsers = []
      for (const name of this.usersInputList) {
        if (!!this.users[name]) {
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
    userHistory() {
      setTimeout(() => {
        // Delay execution so the DOM is changed
        // before we ask the dropdown to refresh the selected items.
        try {
          localStorage.setItem('userHistory', this.userHistory.join(','))
        } catch (e) {}
        // $('#user-dropdown').dropdown('refresh')
        $('#user-dropdown').dropdown('set selected', this.usersInputList)
        this.addRemoveIcons()
      })
    }
  },
  methods: {
    fetchLists () {
      const userNames = this.usersInputList
      if (userNames.length === 0) return;
      if (userNames.toString() === lastUserList.toString()) return;
      lastUserList = userNames

      console.log("fetching for", userNames)
      location.assign(location.origin + location.pathname + location.search
                      + "#users=" + userNames.join(","))
      document.title = `AniTogether - ${userNames.join(", ")}`
      // https://stackoverflow.com/questions/36612847/how-can-i-bind-the-html-title-content-in-vuejs
      this.updateUserHistory(userNames)

      // TODO add and remove loading icon
      getMediaLists(userNames, "CURRENT")
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
        .catch(error => {
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
      let inputSet = new Set(inputArray)
      inputSet.delete("")
      return Array.from(inputSet)
    },
    /**
     * Update userHistory in localStorage.
     * @param  {Array} userNames Names to add.
     */
    updateUserHistory (userNames) {
      const userSet = new Set([...this.userHistory, ...userNames])
      let userArray = Array.from(userSet)
      userArray.sort((a, b) => {
        return a.localeCompare(b)
      })
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
    }
  },
})


$('#user-dropdown')
  .dropdown({
    allowAdditions: true,
    clearable: true,
    sortSelect: true,
  })
// Update selected list later to work around
// https://github.com/Semantic-Org/Semantic-UI/issues/3841
$('.dropdown').dropdown('set selected', app.sanitizeInput(hash2Obj.users));
