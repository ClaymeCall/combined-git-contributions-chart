import React, { useRef, useState, useEffect } from "react"
import {
  TbShare,
  TbDownload,
  TbCopy,
  TbBrandGithub,
  TbBrandBitbucket,
  TbBrandGitlab
} from "react-icons/tb"
import {
  download,
  fetchGithubData,
  downloadJSON,
  share,
  copyToClipboard,
  fetchBitbucketData,
  fetchGitlabData,
  fetchCodebergData
} from "../utils/export"
import ThemeSelector from "../components/themes"
import makeAnimated from "react-select/animated"
import Select from "react-select"
import { MuiChipsInput } from "mui-chips-input"
import { combineYears } from "../utils/api/general"

const App = () => {
  const inputRef = useRef()
  const canvasRef = useRef()
  const contentRef = useRef()
  const [loading, setLoading] = useState(false)
  const [theme, setTheme] = useState("standard")
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  // GitHub
  const [username, setUsername] = useState("")
  const [showGitHubForm, setShowGithubForm] = useState(false)
  // Bitbucket
  const [bitbucketUsername, setBitbucketUsername] = useState("")
  const [bitbucketDisplayName, setBitbucketDisplayName] = useState("")
  const [bitbucketAppPassword, setBitbucketAppPassword] = useState("")
  const [bitbucketWorkspace, setBitbucketWorkspace] = useState("")
  const [bitbucketRepoChips, setBitbucketRepoChips] = React.useState([])
  const [showBitbucketForm, setShowBitbucketForm] = useState(false)
  // Gitlab
  const [gitlabDisplayName, setGitlabDisplayName] = useState("")
  const [gitlabAccessToken, setGitlabAccessToken] = useState("")
  const [gitlabProjectIdChips, setGitlabProjectIdChips] = useState([])
  const [showGitlabForm, setShowGitlabForm] = useState(false)
  // Codeberg
  const [codebergUsername, setCodebergUsername] = useState("")
  const [codebergAccessToken, setCodebergAccessToken] = useState("")
  const [showCodebergForm, setShowCodebergForm] = useState(false)
  //VCS
  const animatedComponents = makeAnimated()
  const [vcsSelection, setVcsSelection] = useState([])
  const options = [
    { value: "GitHub", label: "GitHub" },
    { value: "Bitbucket", label: "Bitbucket" },
    { value: "Gitlab", label: "Gitlab" },
    { value: "Codeberg", label: "Codeberg" }
  ]

  useEffect(() => {
    if (!data) {
      return
    }
    draw()
  }, [data, theme])

  const handleSubmit = (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setData(null)
    setUsername(username)
    const bitbucketBody = {
      bitbucketUsername,
      bitbucketDisplayName,
      bitbucketAppPassword,
      bitbucketWorkspace,
      bitbucketRepoChips
    }
    const gitlabBody = {
      gitlabDisplayName,
      gitlabAccessToken,
      gitlabProjectIdChips
    }
    const codebergBody = {
      codebergUsername,
      codebergAccessToken
    }

    let currentVCS = []
    for (const vcs of vcsSelection) {
      switch (vcs.value) {
        case "GitHub":
          const githubPromise = fetchGithubData(username)
          currentVCS.push(githubPromise)
          break
        case "Bitbucket":
          const bitbucketPromise = fetchBitbucketData(bitbucketBody)
          currentVCS.push(bitbucketPromise)
          break
        case "Gitlab":
          const gitlabPromise = fetchGitlabData(gitlabBody)
          currentVCS.push(gitlabPromise)
          break
        case "Codeberg":
          const codebergPromise = fetchCodebergData(codebergBody)
          currentVCS.push(codebergPromise)
          break
        default:
          console.log("Unknown VCS")
      }
    }

    Promise.all(currentVCS)
      .then((results) => {
        const combinedYears = []
        const combinedContributions = []
        let vcsData = []
        results.forEach((data, index) => {
          if (data) {
            vcsData.push(data)
          }
        })

        vcsData.forEach((data) => {
          if (data) {
            combinedYears.push(...data.years)
            combinedContributions.push(...data.contributions)
          }
        })

        const combinedData = {
          years: combineYears(combinedYears),
          contributions: combinedContributions
        }
        console.log(combinedData)
        setData(combinedData)
        // !bitbucketData?.length && !gitlabData?.length && !githubData?.length
        //   ? setError("Could not find any commits in your profiles")
        //   : setData(combinedData)

        setLoading(false)
      })
      .catch((err) => {
        console.error(err)
        setLoading(false)
        setError("Unable to fetch profile data successfully...")
      })
  }

  const handleBitbucketChipChange = (chips) => {
    setBitbucketRepoChips(chips)
  }
  const handleGitlabChipChange = (chips) => {
    setGitlabProjectIdChips(chips)
  }

  const onDownload = (e) => {
    e.preventDefault()
    download(canvasRef.current)
  }

  const onCopy = (e) => {
    e.preventDefault()
    copyToClipboard(canvasRef.current)
  }

  const onDownloadJson = (e) => {
    e.preventDefault()
    if (data != null) {
      downloadJSON(data)
    }
  }

  const onShare = (e) => {
    e.preventDefault()
    share(canvasRef.current)
  }

  const onVCSInputChange = (inputValue, { action, prevInputValue }) => {
    if (
      action === "select-option" ||
      action === "remove-value" ||
      action === "clear"
    ) {
      setVcsSelection(inputValue)
      inputValue.some((item) => item.value === "GitHub")
        ? setShowGithubForm(true)
        : setShowGithubForm(false)
      inputValue.some((item) => item.value === "Bitbucket")
        ? setShowBitbucketForm(true)
        : setShowBitbucketForm(false)
      inputValue.some((item) => item.value === "Gitlab")
        ? setShowGitlabForm(true)
        : setShowGitlabForm(false)
      inputValue.some((item) => item.value === "Codeberg")
        ? setShowCodebergForm(true)
        : setShowCodebergForm(false)
    }
  }

  const draw = async () => {
    if (!canvasRef.current || !data) {
      setError("Something went wrong... Check back later.")
      return
    }

    const { drawContributions } = await import("github-contributions-canvas")
    drawContributions(canvasRef.current, {
      data,
      username: username,
      themeName: theme,
      footerText: "Made by @Sallar on GitHub"
    })
    contentRef.current.scrollIntoView({
      behavior: "smooth"
    })
  }

  const renderGithubButton = () => {
    return (
      <div className="App-github-button">
        <a
          className="github-button"
          href="https://github.com/TrentD815/combined-git-contributions-chart"
          data-size="large"
          data-show-count="true"
          aria-label="Star TrentD815/combined-git-contribution-chart on GitHub"
        >
          Star
        </a>
      </div>
    )
  }

  const renderLoading = () => {
    return (
      <div className="App-centered">
        <div className="App-loading">
          <img src={"/loading.gif"} alt="Loading..." width={200} />
          <p>
            Please wait, pulling data from your selected version control
            systems...This may take a few minutes depending on the number of
            repositories and quantity of commits...
          </p>
        </div>
      </div>
    )
  }

  const renderGraphs = () => {
    return (
      <div
        className="App-result"
        style={{ display: data !== null && !loading ? "block" : "none" }}
      >
        <p>Your chart is ready!</p>

        {data !== null && (
          <>
            <div className="App-buttons">
              <button
                className="App-download-button"
                onClick={onCopy}
                type="button"
              >
                <TbCopy size={18} />
                Copy
              </button>
              <button
                className="App-download-button"
                onClick={onDownload}
                type="button"
              >
                <TbDownload size={18} />
                Download
              </button>
              {global.navigator && "share" in navigator && (
                <button
                  className="App-download-button"
                  onClick={onShare}
                  type="button"
                >
                  <TbShare size={18} />
                  Share
                </button>
              )}
            </div>
            <canvas ref={canvasRef} />
          </>
        )}
      </div>
    )
  }

  const renderForm = () => {
    return (
      <form onSubmit={handleSubmit}>
        <Select
          instanceId="eaa53c4b-392e-402e-a779-57636ddc5db3"
          isMulti
          options={options}
          className="basic-multi-select vcsSelect"
          classNamePrefix="select"
          components={animatedComponents}
          onChange={onVCSInputChange}
          placeholder="Select your version control systems..."
          value={vcsSelection}
        />

        {showGitHubForm ? githubFormItems() : null}
        {showBitbucketForm ? bitbucketFormItems() : null}
        {showGitlabForm ? gitlabFormItems() : null}
        {showCodebergForm ? codebergFormItems() : null}

        <button
          type="submit"
          disabled={
            vcsSelection.length <= 0 ||
            loading ||
            githubFormNotComplete() ||
            bitbucketFormNotComplete() ||
            gitlabFormNotComplete() ||
            codebergFormNotComplete()
          }
        >
          <span role="img" aria-label="Stars">
            ✨
          </span>{" "}
          {loading ? "Generating..." : "Generate!"}
        </button>
      </form>
    )
  }

  const githubFormNotComplete = () => {
    return showGitHubForm && username.length <= 0
  }

  const bitbucketFormNotComplete = () => {
    return (
      showBitbucketForm &&
      (bitbucketUsername.length <= 0 ||
        bitbucketDisplayName.length <= 0 ||
        bitbucketWorkspace.length <= 0 ||
        bitbucketAppPassword.length <= 0 ||
        bitbucketRepoChips.length <= 0)
    )
  }

  const gitlabFormNotComplete = () => {
    return (
      showGitlabForm &&
      (gitlabProjectIdChips.length <= 0 ||
        gitlabDisplayName.length <= 0 ||
        gitlabAccessToken.length <= 0)
    )
  }

  const codebergFormNotComplete = () => {
    return showCodebergForm && codebergUsername.length <= 0
  }

  const githubFormItems = () => {
    return (
      <>
        <h3>
          <TbBrandGithub color={"black"} size={30} />
          <span>GitHub</span>
        </h3>
        <input
          ref={inputRef}
          placeholder="GitHub Username"
          onChange={(e) => setUsername(e.target.value)}
          value={username}
          id="username"
          autoCorrect="off"
          autoCapitalize="none"
          autoFocus
          autoComplete="false"
        />
      </>
    )
  }

  const bitbucketFormItems = () => {
    return (
      <>
        <h3>
          <TbBrandBitbucket color={"blue"} size={30} />
          <span>Bitbucket</span>
        </h3>
        <input
          title="Bitbucket Username"
          ref={inputRef}
          placeholder="Bitbucket Username"
          onChange={(e) => setBitbucketUsername(e.target.value)}
          value={bitbucketUsername}
          id="bitbucketUsername"
          autoComplete="false"
          autoCorrect="off"
          autoCapitalize="none"
        />
        <input
          title="Bitbucket Display Name"
          ref={inputRef}
          placeholder="Bitbucket Display Name"
          onChange={(e) => setBitbucketDisplayName(e.target.value)}
          value={bitbucketDisplayName}
          id="bitbucketDisplayName"
          autoComplete="false"
          autoCorrect="off"
          autoCapitalize="none"
        />
        <input
          title="Bitbucket App Password"
          ref={inputRef}
          placeholder="Bitbucket App Password"
          onChange={(e) => setBitbucketAppPassword(e.target.value)}
          value={bitbucketAppPassword}
          type="password"
          id="bitbucketAppPassword"
          autoCorrect="off"
          autoCapitalize="none"
        />
        <input
          title="Bitbucket Workspace"
          ref={inputRef}
          placeholder="Bitbucket Workspace"
          onChange={(e) => setBitbucketWorkspace(e.target.value)}
          value={bitbucketWorkspace}
          id="bitbucketWorkspace"
          autoCorrect="off"
          autoCapitalize="none"
        />
        <MuiChipsInput
          title="Bitbucket Repo Names"
          color="primary"
          placeholder="Type and enter your Bitbucket repository names"
          fullWidth
          variant="filled"
          id="bitbucketRepoChips"
          value={bitbucketRepoChips}
          onChange={handleBitbucketChipChange}
        />
      </>
    )
  }

  const gitlabFormItems = () => {
    return (
      <>
        <h3>
          <TbBrandGitlab color={"orange"} size={30} />
          <span>Gitlab</span>
        </h3>
        <input
          title="Gitlab Display Name"
          ref={inputRef}
          placeholder="Gitlab Display Name"
          onChange={(e) => setGitlabDisplayName(e.target.value)}
          value={gitlabDisplayName}
          id="gitlabDisplayName"
          autoComplete="false"
          autoCorrect="off"
          autoCapitalize="none"
        />
        <input
          title="Gitlab Access Token"
          ref={inputRef}
          placeholder="Gitlab Access Token"
          onChange={(e) => setGitlabAccessToken(e.target.value)}
          value={gitlabAccessToken}
          type="password"
          id="gitlabAccessToken"
          autoComplete="false"
          autoCorrect="off"
          autoCapitalize="none"
        />
        <MuiChipsInput
          title="Gitlab Project Ids"
          color="warning"
          placeholder="Type and enter your Gitlab project ids"
          fullWidth
          variant="filled"
          id="gitlabProjectIdChips"
          value={gitlabProjectIdChips}
          onChange={handleGitlabChipChange}
        />
      </>
    )
  }

  const CodebergIcon = () => (
    <svg
      height="30"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 2L2 7V17L12 22L22 17V7L12 2Z"
        fill="#FF6633"
        stroke="#FF6633"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M12 8L8 10V14L12 16L16 14V10L12 8Z" fill="white" />
    </svg>
  )

  const codebergFormItems = () => {
    return (
      <>
        <h3>
          <CodebergIcon />
          <span>Codeberg</span>
        </h3>
        <input
          title="Codeberg Username"
          ref={inputRef}
          placeholder="Codeberg Username"
          onChange={(e) => setCodebergUsername(e.target.value)}
          value={codebergUsername}
          id="codebergUsername"
          autoComplete="false"
          autoCorrect="off"
          autoCapitalize="none"
          autoFocus
        />
        <input
          title="Codeberg Access Token (optional - for private repos)"
          ref={inputRef}
          placeholder="Access Token (optional - for private repos)"
          onChange={(e) => setCodebergAccessToken(e.target.value)}
          value={codebergAccessToken}
          type="password"
          id="codebergAccessToken"
          autoComplete="false"
          autoCorrect="off"
          autoCapitalize="none"
        />
      </>
    )
  }

  const renderVCSLogos = () => {
    return (
      <span className="App-buttons">
        GitHub | Bitbucket | Gitlab | Codeberg
      </span>
    )
  }

  const _renderError = () => {
    return (
      <div className="App-error App-centered">
        <p>{error}</p>
      </div>
    )
  }

  const _renderDownloadAsJSON = () => {
    if (data === null) return
    return (
      <a href="#" onClick={onDownloadJson}>
        <span role="img" aria-label="Bar Chart">
          📊
        </span>{" "}
        Download data as JSON for your own visualizations
      </a>
    )
  }

  return (
    <div className="App">
      <header className="App-header">
        <div className="App-logo">
          <img src="/vcs.webp" width={150} alt="all vcs logos" />
          <h1>Combined VCS Contributions Chart Generator</h1>
          <h4>All your contributions in one image!</h4>
        </div>
        {renderVCSLogos()}
        {renderForm()}
        <ThemeSelector
          currentTheme={theme}
          onChangeTheme={(themeName) => setTheme(themeName)}
        />
        {renderGithubButton()}
        <footer>
          <p>
            Not affiliated with GitHub, Gitlab, Atlassian, Amazon, or Microsoft
          </p>
          {_renderDownloadAsJSON()}
        </footer>
      </header>
      <section className="App-content" ref={contentRef}>
        {loading && renderLoading()}
        {error !== null && _renderError()}
        {renderGraphs()}
      </section>
    </div>
  )
}

export default App
