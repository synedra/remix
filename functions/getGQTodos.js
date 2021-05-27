const { getRestClient, requestWithRetry, wait, astraRestClient } = require("./utils/astraRestClient");
let client = astraRestClient
exports.handler = async (event, context) => {
  if (!client) {
    client = await getClient();
  }
  console.log("Waiting for Graph QL")
  await waitForGraphQL();
  console.log("Done")
  let query = `query GQTodos {
    graphql (value: {key:"graphql"}) {
      values {
        id
        text
        completed
        key
      }
    }}`
    console.log(query)
    

  try {
    res = await client.post('/api/graphql/todos', query={query})
    console.log(res)
    const formattedTodos = Object.keys(res.data.graphql.values).map((item) => res.data.graphql.values[item]);
    return {
      headers: '{Content-Type: application/json}',
      statusCode: 200,
      body: JSON.stringify(formattedTodos),
    };
  } catch (e) {
    return {
      statusCode: 400,
      body: JSON.stringify(e),
    };
  }
};

async function getClient() {
  let client = await getRestClient();
  if (client === null) {
    wait(1000)
    return getClient()
  }
  return client
}

async function waitForGraphQL() {
  let tables = await client.get('/api/rest/v2/schemas/keyspaces/todos/tables')
  let indices = await client.get('/api/rest/v2/schemas/keyspaces/todos/tables/graphql/indexes')
  let results = tables.data.filter(entry => entry.name === "graphql");
    if (!indices.data.length) {
      wait(1000)
      return waitForGraphQL();
    }
  return results;
}