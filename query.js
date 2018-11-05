function buildQuery(userNames) {
  var query = `query WatchingProgress($status: [MediaListStatus]) {`
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
  console.log(query)
  return query
}

function getMediaLists(userNames, status, handleData) {
  var variables = {
    status: status,
  }

  // TODO build query for multiple users
  var url = 'https://graphql.anilist.co',
    options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Origin': 'https://anilist.co',
      },
      body: JSON.stringify({
        query: buildQuery(userNames),
        variables: variables,
      })
    }

  return (fetch(url, options)
    .then(handleResponse)
    .then(handleData)
    .catch(handleError))
}


function handleResponse(response) {
  return response.json().then(json => response.ok ? json : Promise.reject(json))
}

function handleError(error) {
  alert('Error, check console')
  console.error(error)
}
