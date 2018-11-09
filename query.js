/* global getMediaLists */
'use strict'

function buildQuery (userNames) {
  let query = `query WatchingProgress($status: [MediaListStatus]) {`
  for (const [i, userName] of userNames.entries()) {
    query += `
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
                userPreferred
              }
              synonyms
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
      }`
  }
  query += "\n}"
  return query
}

// eslint-disable-next-line no-unused-vars
function getMediaLists (userNames, status) {
  const url = 'https://graphql.anilist.co'
  const variables = {
    status,
  }
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      // 'Origin': 'https://anilist.co',
    },
    body: JSON.stringify({
      query: buildQuery(userNames),
      variables,
    }),
  }

  return fetch(url, options)
    .then(response => response.json().then(json => response.ok ? json : Promise.reject(json)))
}
