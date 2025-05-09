import { print } from 'graphql' // Import the `print` function to convert AST to string
interface SWRError extends Error {
  info: any
  status: number
}
export async function fetcher<JSON = any>(
  input: RequestInfo | [string, string?, Record<string, any>?], // Supports REST, GraphQL, and GraphQL with URL
  init?: RequestInit
): Promise<JSON> {
  // Retrieve the token from localStorage
  const client = localStorage.getItem('client')
  const token = client ? JSON.parse(client).token : null

  // Determine if the request is for GraphQL or REST
  const isGraphQL = Array.isArray(input) // GraphQL requests are passed as an array
  const [urlOrQuery, graphqlUrlOrVariables, variables] = isGraphQL
    ? input.length === 3
      ? [input[0], input[1], input[2]] // GraphQL with URL: [query, graphqlUrl, variables]
      : [input[0], undefined, input[1]] // GraphQL without URL: [query, variables]
    : [input, undefined, undefined] // REST: [url]

  // Fix: If variables are a JSON-encoded string, parse them back into an object
  const parsedVariables = typeof variables === 'string' ? JSON.parse(variables) : variables

  // Merge headers to include the Bearer token
  const headers = {
    ...init?.headers, // Preserve existing headers
    Authorization: token ? `Bearer ${token}` : '',
  }

  // Prepare the request options
  const requestOptions: RequestInit = {
    ...init, // Preserve other request options
    headers, // Use the updated headers
  }

  // Handle GraphQL requests
  if (isGraphQL) {
    requestOptions.method = 'POST'
    requestOptions.body = JSON.stringify({
      query: typeof urlOrQuery === 'string' || urlOrQuery instanceof Request ? urlOrQuery : print(urlOrQuery), // Ensure the query is a string or Request
      variables: parsedVariables || undefined,
    })
    headers['Content-Type'] = 'application/json'
  }

  // Determine the endpoint URL
  const endpointUrl = isGraphQL
    ? graphqlUrlOrVariables || '/api/v1/graphql' // Use provided GraphQL URL or default GQL url
    : urlOrQuery // Use the REST URL

  // Make the fetch request
  const res = await fetch(endpointUrl, requestOptions)

  // Handle errors
  if (!res.ok) {
    const message = (await res.json())?.error?.message || 'An error occurred while fetching the data.'
    const error = new Error(message) as SWRError
    error.info = message
    error.status = res.status

    throw error
  }

  // Return the JSON response
  return res.json()
}
