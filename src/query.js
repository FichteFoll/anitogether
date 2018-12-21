// https://github.com/AniList/ApiV2-GraphQL-Docs
// https://anilist.gitbook.io/anilist-apiv2-docs/

function buildQuery (userNames) {
  let query = `query WatchingProgress($status: [MediaListStatus]) {\n`
  const tmplOffset = 2
  let tmplLen = 0
  for (const [i, userName] of userNames.entries()) {
    const tmpl = `\
      user${i}: MediaListCollection(status_in: $status, userName: "${userName}", type: ANIME) {
        user {
          id
          name
          avatar {
            medium
          }
        }
        lists {
          isCustomList
          entries {
            media {
              id
              title {
                romaji
                english
                native
              }
              episodes
              nextAiringEpisode {
                episode
              }
              status
            }
            status
            score
            progress
          }
        }
      }\n`
    // TODO get nextAiringEpisode timestamp and show on hover
    if (tmplLen === 0) tmplLen = tmpl.split("\n").length - 1
    query += tmpl
  }
  query += "}"
  return {query, tmplOffset, tmplLen}
}

export function getMediaLists (userNames, status) {
  const url = 'https://graphql.anilist.co'
  const variables = {
    status,
  }
  const {query, tmplOffset, tmplLen} = buildQuery(userNames)
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  }

  return fetch(url, options)
    .then(response => response.json().then(json => response.ok ? json : Promise.reject(json)))
    .catch((json) => {
      // Attempt to determine user that wasn't found
      // and replace message.
      if (json.errors) {
        for (const error of json.errors) {
          const {message, locations} = error
          if (message === "User not found") {
            const [{line}] = locations
            const userIndex = (line - tmplOffset) / tmplLen
            error.message = `User ${userNames[Math.floor(userIndex)]} not found`
          }
        }
      }
      return Promise.reject(json)
    })
}
