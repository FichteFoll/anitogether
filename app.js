const app = new Vue({
  el: '#app',
  data: {
    // would like to use Maps, but Vue doesn't support those in v-for
    // https://github.com/vuejs/vue/issues/2410
    sourceEntries: {},
    entriesChangeTracker: 1,
    users: {},
  },
  computed: {
    entries () {
      this.entriesChangeTracker
      let dstEntries = new Map()
      for (let [userName, srcEntries] of Object.entries(this.sourceEntries)) {
        for (let {media, ...rest} of srcEntries) {
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
      this.entriesChangeTracker
      let userList = Array.from(Object.values(this.users))
      userList.sort((a, b) => {
        return a.name.localeCompare(b.name)
      })
      return userList
    }
  },
  created () {
    let userNames = ["FichteFoll", "Firebird97", "Gattix"]
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
          this.sourceEntries[user.name] = entries
          this.users[user.name] = user
        }
        this.entriesChangeTracker += 1
      })
  },
  onUsersInput() {
    // location.replace()
  }
})
