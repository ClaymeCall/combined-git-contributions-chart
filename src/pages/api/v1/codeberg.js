import {
  combineDuplicates,
  summarizeContributions
} from "../../../utils/api/general"

const CODEBERG_BASE_URL = "https://codeberg.org/api/v1"

const CONTRIBUTION_OP_TYPES = new Set([
  "commit_repo",
  "create_issue",
  "close_issue",
  "reopen_issue",
  "create_pull_request",
  "close_pull_request",
  "reopen_pull_request",
  "merge_pull_request",
  "approve_pull_request",
  "reject_pull_request",
  "comment_issue",
  "comment_pull",
  "watch_repo",
  "publish_release",
  "create_repo",
  "push_tag"
])

export default async (req, res) => {
  try {
    let codeberg = JSON.parse(req.body)
    codeberg = codeberg.body
    const accessToken = codeberg.codebergAccessToken
    const username = codeberg.codebergUsername
    const contributions = []
    let totalCount = 0

    const headers = {
      "Content-Type": "application/json"
    }
    if (accessToken) {
      headers["Authorization"] = `token ${accessToken}`
    }

    let page = 1
    const limit = 50
    let hasMorePages = true

    while (hasMorePages) {
      const url = `${CODEBERG_BASE_URL}/users/${username}/activities/feeds?only-performed-by=true&page=${page}&limit=${limit}`
      console.log(
        `Fetching Codeberg activity feeds for ${username}, page ${page}`
      )

      const response = await fetch(url, {
        method: "GET",
        headers
      })

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`User "${username}" not found on Codeberg`)
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const activities = await response.json()

      if (!activities || activities.length === 0) {
        hasMorePages = false
        break
      }

      for (const activity of activities) {
        if (CONTRIBUTION_OP_TYPES.has(activity.op_type)) {
          const date = activity.created.split("T")[0]
          contributions.push({
            date,
            count: 1,
            color: "#9be9a8",
            intensity: "1"
          })
          totalCount++
        }
      }

      const linkHeader = response.headers.get("Link")
      if (linkHeader && linkHeader.includes('rel="next"')) {
        page++
      } else {
        hasMorePages = false
      }
    }

    console.log(`Total contributions fetched: ${totalCount}`)

    const years = summarizeContributions(contributions)
    const combinedContributions = combineDuplicates(contributions)

    return res.status(200).json({
      message: "Codeberg contributions retrieved successfully",
      years,
      contributions: combinedContributions
    })
  } catch (error) {
    console.error("Error fetching Codeberg contributions:", error.message)
    return res.status(500).json({
      message: "Unable to get Codeberg contributions",
      error: error.message
    })
  }
}
