const hash2Obj = location.hash.substring(1)
      .split("&")
      .map(v => v.split("="))
      .reduce( (pre, [key, value]) => ({ ...pre, [key]: value }), {} )

const app = new Vue({
  el: '#app',
  data: {
    // would like to use Maps, but Vue doesn't support those in v-for
    // https://github.com/vuejs/vue/issues/2410
    sourceEntries: {},
    users: {},
    usersInput: hash2Obj.users || ""
  },
  computed: {
    entries () {
      let dstEntries = new Map()
      for (const [userName, srcEntries] of Object.entries(this.sourceEntries)) {
        for (const {media, ...rest} of srcEntries) {
          if (!dstEntries.has(media.id)) {
            dstEntries.set(media.id, {media: media, users: new Map()})
          }
          dstEntries.get(media.id).users.set(userName, rest)
        }
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
    }
  },
  created () {
    this.fetchLists()
  },
  onUsersInput() {
    this.fetchLists()
  },
  methods: {
    fetchLists () {
      console.log("fetching", this.usersInput)
      if (this.usersInput === "") return;
      // or location.assign()
      location.replace(location.origin + location.pathname + location.search
                       + "#users=" + this.usersInput)
      const userNames = this.usersInput.split(",")
      document.title = `AniTogether - ${userNames.join(", ")}`
      getMediaLists(userNames, "CURRENT")
        // TODO handle errors
        .then(json => {
          console.log("results for users", userNames, json)
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
    }
  },
})
