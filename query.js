var query = `
query WatchingProgress($userName: String, $status: [MediaListStatus]) {
  MediaListCollection(status_in: $status, userName: $userName, type: ANIME) {
    user {
      id
      name
      avatar {
        medium
      }
    }
    lists {
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
  }
}
`;

function getMediaList(name, status, handleData) {
  var variables = {
    userName: name,
    status: status,
  }

  var url = 'https://graphql.anilist.co',
    options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Origin': 'https://anilist.co',
      },
      body: JSON.stringify({
        query: query,
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
