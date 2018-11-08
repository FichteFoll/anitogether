# AniTogether

Use me: <https://fichtefoll.github.io/anitogether/>

When watching (airing) anime together,
but you don't know how far in you are,
AniTogether provides an overview
on the progress of each user specified.

Just enter AniList usernames into the input box
to get a table comparison with all the anime the users watch.
All dynamic content is fetched and rendered on the client,
so you must enable JavaScript.

Thanks to [AniList][] and its very usable API.

[AniList]: https://anilist.co/


## Features

- Show episode progress by each user
- Show user's score on hover
- Highlight anime with unwatched episodes
- Highlight users that are behind compared to the "leader"
  (with the most episodes watched)
- Save a list of previously entered user names for quick access

![Screenshot](./screenshot.png)

## Technology

- [Vue.js](https://vuejs.org/)
- [Semantic UI](https://semantic-ui.com/)
- [ECMAScript 6](http://es6-features.org/)
- No build steps required; everything is static!

Incompatible with Internet Explorer (and maybe Edge?).
Use a recent and modern browser.


## TODO

Roughly ordered by priority:

- cache per-user results so changing the order or adding/removing
  doesn't request data for ALL users again
- allow hiding and unhiding anime (and preserve in url, prolly by id)
- allow removing individual entries from history
- option to include PAUSED anime and highlight this in the table
- explore more visual approach where columns are the episode number
  and the user's avatar is inserted in the cells; needs smart collapsing
- something for PLANNED shows
