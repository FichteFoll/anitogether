# AniTogether

Use me: <https://fichtefoll.github.io/anitogether/>
(very WIP, no styling)

When watching (airing) anime together,
but you don't know how far in you are,
AniTogether provides an overview
on the progress of each user specified.

Just enter the AniList usernames into the input,
separated by commas,
and submit with enter
to get a table with all the anime the users watch.

Thanks to [AniList][] and its very usable API.

[AniList]: https://anilist.co/


# TODO

- make an actual design
  - highlight airing and finished anime
  - highlight when no user has seen the latest episode
  - highlight when user is behind
  - render user avatars
- option to include PAUSED anime and highlight this in the table
- explore more visual approach where columns are the episode number
  and the user's avatar is inserted in the cells; needs smart collapsing
- allow hiding and unhiding anime (and preserve in url, prolly by id)
