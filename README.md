# AniTogether

Use me: <https://fichtefoll.github.io/anitogether/>

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

- allow removing individual history entries
- allow hiding and unhiding anime (and preserve in url, prolly by id)
- cache per-user results so changing the order or adding/removing
  doesn't request data for ALL users again
- option to include PAUSED anime and highlight this in the table
- explore more visual approach where columns are the episode number
  and the user's avatar is inserted in the cells; needs smart collapsing
- something for PLANNED shows
