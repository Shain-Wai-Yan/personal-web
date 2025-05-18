// Configuration - Set to your GitHub username
const GITHUB_USERNAME = "Shain-Wai-Yan"; // Already set to your username

// Your custom server endpoint
const SERVER_URL = "https://github-api-server-5d05.onrender.com";

// GitHub API endpoints through your proxy server
const PROFILE_URL = `${SERVER_URL}/api/github/users/${GITHUB_USERNAME}`;
const REPOS_URL = `${SERVER_URL}/api/github/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=10`;
const EVENTS_URL = `${SERVER_URL}/api/github/users/${GITHUB_USERNAME}/events?per_page=10`;
const LANGUAGES_URL = `${SERVER_URL}/api/github/users/${GITHUB_USERNAME}/top-languages`; // Updated to use new endpoint
const CONTRIBUTIONS_URL = `${SERVER_URL}/api/github/users/${GITHUB_USERNAME}/contributions`; // Uses the new GraphQL endpoint
const PINNED_REPOS_URL = `${SERVER_URL}/api/github/users/${GITHUB_USERNAME}/pinned`; // New endpoint for pinned repos
const DETAILED_ACTIVITY_URL = `${SERVER_URL}/api/github/users/${GITHUB_USERNAME}/detailed-activity`; // New endpoint for detailed activity

// DOM elements
const profileName = document.getElementById("profile-name");
const profileUsername = document.getElementById("profile-username");
const profileAvatar = document.getElementById("profile-avatar");
const profileBio = document.getElementById("profile-bio");
const reposCount = document.getElementById("repos-count");
const followersCount = document.getElementById("followers-count");
const followingCount = document.getElementById("following-count");
const totalContributions = document.getElementById("total-contributions");
const contributionGraph = document.getElementById("contribution-graph");
const repositoriesList = document.getElementById("repositories-list");
const activityList = document.getElementById("activity-list");
const languagesContainer = document.getElementById("languages-container");
const pinnedReposContainer = document.getElementById("pinned-repos-container"); // New element for pinned repos

// Repository viewer elements
const repoViewerModal = document.getElementById("repo-viewer-modal");
const repoViewerTitle = document.getElementById("repo-viewer-title");
const repoViewerClose = document.getElementById("repo-viewer-close");
const repoViewerBreadcrumb = document.getElementById("repo-viewer-breadcrumb");
const repoViewerFiles = document.getElementById("repo-viewer-files");
const repoViewerFileHeader = document.getElementById("repo-viewer-file-header");
const repoViewerFileContent = document.getElementById(
  "repo-viewer-file-content"
);

// Current repository viewer state
let currentRepo = "";
let currentPath = "";
let currentBranch = "main"; // Default branch

// Add error handling for fetch calls
async function fetchWithErrorHandling(url, options = {}) {
  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `Error fetching ${url}: ${response.status} ${response.statusText}`
      );
      console.error(`Response: ${errorText}`);
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Fetch error for ${url}:`, error);
    throw error;
  }
}

// Fetch profile data
async function fetchProfile() {
  try {
    const response = await fetch(PROFILE_URL);
    if (!response.ok) throw new Error("Failed to fetch profile");

    const data = await response.json();

    // Update profile information
    profileName.textContent = data.name || data.login;
    profileUsername.textContent = `@${data.login}`;
    if (data.avatar_url) {
      profileAvatar.src = data.avatar_url;
    }
    profileBio.textContent = data.bio || "";

    // Update stats
    reposCount.textContent = data.public_repos;
    followersCount.textContent = data.followers;
    followingCount.textContent = data.following;
  } catch (error) {
    console.error("Error fetching profile:", error);
    profileName.textContent = "Error loading profile";
    showError(
      "Could not load GitHub profile. Please check your internet connection and try again."
    );
  }
}

// Fetch repositories
async function fetchRepositories() {
  try {
    const response = await fetch(REPOS_URL);
    if (!response.ok) throw new Error("Failed to fetch repositories");

    const repos = await response.json();

    // Clear loading message
    repositoriesList.innerHTML = "";

    // Check if there are any repositories
    if (repos.length === 0) {
      showEmptyState(
        repositoriesList,
        "No repositories found",
        "This user has not created any public repositories yet."
      );
      return;
    }

    // Add repositories to the list
    repos.forEach((repo) => {
      const repoElement = document.createElement("div");
      repoElement.className = "repository-card";

      // Calculate commit bar width based on repo size (just for visualization)
      const commitBarWidth = Math.min(100, (repo.size / 1000) * 100);

      repoElement.innerHTML = `
                <button class="view-repo-btn" data-repo="${repo.name}">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                    View Files
                </button>
                <h3 class="repository-name">
                    <a href="${repo.html_url}" target="_blank">${repo.name}</a>
                </h3>
                <p class="repository-description">${
                  repo.description || "No description"
                }</p>
                <div class="repository-stats">
                    <div class="repository-stat">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z"></path>
                            <circle cx="12" cy="12" r="4"></circle>
                        </svg>
                        ${repo.language || "None"}
                    </div>
                    <div class="repository-stat">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
                        </svg>
                        ${repo.forks_count} forks
                    </div>
                    <div class="repository-stat">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"></path>
                        </svg>
                        ${repo.stargazers_count} stars
                    </div>
                </div>
                <div class="commit-bar" style="width: ${commitBarWidth}%"></div>
            `;

      repositoriesList.appendChild(repoElement);

      // Add event listener to the "View Files" button
      const viewRepoBtn = repoElement.querySelector(".view-repo-btn");
      viewRepoBtn.addEventListener("click", () => {
        openRepositoryViewer(repo.name, repo.default_branch || "main");
      });
    });
  } catch (error) {
    console.error("Error fetching repositories:", error);
    showError("Could not load repositories. Please try again later.");
  }
}

// Fetch pinned repositories - NEW FUNCTION
async function fetchPinnedRepositories() {
  try {
    // Check if the container exists
    if (!pinnedReposContainer) return;

    pinnedReposContainer.innerHTML =
      '<div class="loading">Loading pinned repositories...</div>';

    const data = await fetchWithErrorHandling(PINNED_REPOS_URL);

    // Clear loading message
    pinnedReposContainer.innerHTML = "";

    // Check if there are any pinned repositories
    if (!data || data.length === 0) {
      showEmptyState(
        pinnedReposContainer,
        "No pinned repositories",
        "This user has not pinned any repositories yet."
      );
      return;
    }

    // Create pinned repositories section header
    const sectionHeader = document.createElement("h2");
    sectionHeader.textContent = "Pinned Repositories";
    pinnedReposContainer.appendChild(sectionHeader);

    // Create container for pinned repo cards
    const pinnedGrid = document.createElement("div");
    pinnedGrid.className = "pinned-repos-grid";
    pinnedReposContainer.appendChild(pinnedGrid);

    // Add pinned repositories to the grid
    data.forEach((repo) => {
      const pinnedCard = document.createElement("div");
      pinnedCard.className = "pinned-repo-card";

      // Format the updated date
      const updatedDate = new Date(repo.updatedAt);
      const updatedDateString = updatedDate.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });

      pinnedCard.innerHTML = `
        <h3 class="pinned-repo-name">
          <a href="${repo.url}" target="_blank">${repo.name}</a>
        </h3>
        <p class="pinned-repo-description">${
          repo.description || "No description"
        }</p>
        <div class="pinned-repo-stats">
          ${
            repo.primaryLanguage
              ? `
            <div class="pinned-repo-language">
              <span class="language-color" style="background-color: ${repo.primaryLanguage.color}"></span>
              ${repo.primaryLanguage.name}
            </div>
          `
              : ""
          }
          <div class="pinned-repo-stat">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"></path>
            </svg>
            ${repo.stargazerCount}
          </div>
          <div class="pinned-repo-stat">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
            </svg>
            ${repo.forkCount}
          </div>
          <div class="pinned-repo-updated">Updated on ${updatedDateString}</div>
        </div>
        <button class="view-repo-btn" data-repo="${repo.name}">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
          View Files
        </button>
      `;

      pinnedGrid.appendChild(pinnedCard);

      // Add event listener to the "View Files" button
      const viewRepoBtn = pinnedCard.querySelector(".view-repo-btn");
      viewRepoBtn.addEventListener("click", () => {
        openRepositoryViewer(repo.name, "main"); // Assuming main branch
      });
    });
  } catch (error) {
    console.error("Error fetching pinned repositories:", error);
    if (pinnedReposContainer) {
      pinnedReposContainer.innerHTML =
        '<div class="error-message">Could not load pinned repositories. Please try again later.</div>';
    }
  }
}

// Fetch activity with more detailed event processing
async function fetchActivity() {
  try {
    const response = await fetch(EVENTS_URL);
    if (!response.ok) throw new Error("Failed to fetch activity");

    const events = await response.json();

    // Clear loading message
    activityList.innerHTML = "";

    // Check if there are any events
    if (events.length === 0) {
      showEmptyState(
        activityList,
        "No recent activity",
        "This user has not had any public activity recently."
      );
      return;
    }

    // Group events by type for better organization
    const groupedEvents = {
      commits: [],
      repositories: [],
      pullRequests: [],
      other: [],
    };

    // Process events and group them
    events.forEach((event) => {
      switch (event.type) {
        case "PushEvent":
          if (event.payload && event.payload.commits) {
            groupedEvents.commits.push({
              repo: event.repo.name,
              count: event.payload.commits.length,
              date: new Date(event.created_at),
              ref: event.payload.ref,
            });
          }
          break;
        case "CreateEvent":
          if (event.payload.ref_type === "repository") {
            groupedEvents.repositories.push({
              repo: event.repo.name,
              date: new Date(event.created_at),
            });
          }
          break;
        case "PullRequestEvent":
          groupedEvents.pullRequests.push({
            repo: event.repo.name,
            action: event.payload.action,
            number: event.payload.number,
            date: new Date(event.created_at),
          });
          break;
        default:
          groupedEvents.other.push({
            type: event.type,
            repo: event.repo.name,
            date: new Date(event.created_at),
          });
      }
    });

    // Display commit summary if available
    if (groupedEvents.commits.length > 0) {
      // Count total commits
      let totalCommits = 0;
      const repoCommits = {};

      groupedEvents.commits.forEach((commit) => {
        totalCommits += commit.count;
        if (!repoCommits[commit.repo]) {
          repoCommits[commit.repo] = 0;
        }
        repoCommits[commit.repo] += commit.count;
      });

      // Get unique repositories
      const repositories = Object.keys(repoCommits);

      // Create commit summary element
      const commitSummary = document.createElement("div");
      commitSummary.className = "activity-summary";

      const icon =
        '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>';

      commitSummary.innerHTML = `
        <div class="activity-icon">${icon}</div>
        <div class="activity-content">
          <div class="activity-header">Created ${totalCommits} commits in ${
        repositories.length
      } ${repositories.length === 1 ? "repository" : "repositories"}</div>
          <div class="activity-details">
            ${Object.entries(repoCommits)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 5)
              .map(
                ([repo, count]) => `
                <div class="activity-repo-item">
                  <span class="activity-repo-name"><a href="https://github.com/${repo}" target="_blank">${
                  repo.split("/")[1]
                }</a></span>
                  <span class="activity-commit-count">${count} commits</span>
                </div>
              `
              )
              .join("")}
          </div>
        </div>
      `;

      activityList.appendChild(commitSummary);
    }

    // Display repository creation summary
    if (groupedEvents.repositories.length > 0) {
      const repoSummary = document.createElement("div");
      repoSummary.className = "activity-summary";

      const icon =
        '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3h18v18H3zM8 12h8M12 8v8"></path></svg>';

      repoSummary.innerHTML = `
        <div class="activity-icon">${icon}</div>
        <div class="activity-content">
          <div class="activity-header">Created ${
            groupedEvents.repositories.length
          } ${
        groupedEvents.repositories.length === 1 ? "repository" : "repositories"
      }</div>
          <div class="activity-details">
            ${groupedEvents.repositories
              .map(
                (repo) => `
                <div class="activity-repo-item">
                  <span class="activity-repo-name"><a href="https://github.com/${
                    repo.repo
                  }" target="_blank">${repo.repo.split("/")[1]}</a></span>
                  <span class="activity-time">${getTimeAgo(repo.date)}</span>
                </div>
              `
              )
              .join("")}
          </div>
        </div>
      `;

      activityList.appendChild(repoSummary);
    }

    // Display pull request summary
    if (groupedEvents.pullRequests.length > 0) {
      const prSummary = document.createElement("div");
      prSummary.className = "activity-summary";

      const icon =
        '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="18" r="3"></circle><circle cx="6" cy="6" r="3"></circle><path d="M6 21V9a9 9 0 0 0 9 9"></path></svg>';

      prSummary.innerHTML = `
        <div class="activity-icon">${icon}</div>
        <div class="activity-content">
          <div class="activity-header">${
            groupedEvents.pullRequests.length
          } Pull Request ${
        groupedEvents.pullRequests.length === 1 ? "activity" : "activities"
      }</div>
          <div class="activity-details">
            ${groupedEvents.pullRequests
              .map(
                (pr) => `
                <div class="activity-repo-item">
                  <span class="activity-pr-action ${pr.action}">${
                  pr.action
                }</span>
                  <span class="activity-repo-name"><a href="https://github.com/${
                    pr.repo
                  }/pull/${pr.number}" target="_blank">PR #${pr.number} in ${
                  pr.repo.split("/")[1]
                }</a></span>
                  <span class="activity-time">${getTimeAgo(pr.date)}</span>
                </div>
              `
              )
              .join("")}
          </div>
        </div>
      `;

      activityList.appendChild(prSummary);
    }

    // Display other events if there are any
    if (groupedEvents.other.length > 0) {
      const otherEvents = groupedEvents.other.slice(0, 5); // Limit to 5 other events

      otherEvents.forEach((event) => {
        const activityElement = document.createElement("div");
        activityElement.className = "activity-item";

        let icon, content;

        // Format the event based on its type
        switch (event.type) {
          case "WatchEvent":
            icon =
              '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"></path></svg>';
            content = `Starred <a href="https://github.com/${event.repo}" target="_blank">${event.repo}</a>`;
            break;
          case "ForkEvent":
            icon =
              '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg>';
            content = `Forked <a href="https://github.com/${event.repo}" target="_blank">${event.repo}</a>`;
            break;
          default:
            icon =
              '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle></svg>';
            content = `${event.type} on <a href="https://github.com/${event.repo}" target="_blank">${event.repo}</a>`;
        }

        // Format date
        const timeAgo = getTimeAgo(event.date);

        activityElement.innerHTML = `
          <div class="activity-icon">${icon}</div>
          <div class="activity-content">
            <div>${content}</div>
            <div class="activity-time">${timeAgo}</div>
          </div>
        `;

        activityList.appendChild(activityElement);
      });
    }

    // Fetch and display detailed activity data
    fetchDetailedActivity();
  } catch (error) {
    console.error("Error fetching activity:", error);
    showError("Could not load activity feed. Please try again later.");
  }
}

// NEW FUNCTION: Fetch detailed activity data from GraphQL endpoint
async function fetchDetailedActivity() {
  try {
    const data = await fetchWithErrorHandling(DETAILED_ACTIVITY_URL);

    // Create a section for detailed activity if it doesn't exist
    let detailedActivitySection = document.getElementById(
      "detailed-activity-section"
    );
    if (!detailedActivitySection) {
      detailedActivitySection = document.createElement("div");
      detailedActivitySection.id = "detailed-activity-section";
      detailedActivitySection.className = "activity-summary detailed-activity";
      activityList.appendChild(detailedActivitySection);
    }

    // Display commit contributions by repository
    if (
      data.commitContributionsByRepository &&
      data.commitContributionsByRepository.length > 0
    ) {
      const commitContributions = document.createElement("div");
      commitContributions.className = "detailed-activity-item";

      const icon =
        '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>';

      commitContributions.innerHTML = `
        <div class="activity-icon">${icon}</div>
        <div class="activity-content">
          <div class="activity-header">Commit Contributions</div>
          <div class="activity-details">
            ${data.commitContributionsByRepository
              .map(
                (item) => `
                <div class="activity-repo-item">
                  <span class="activity-repo-name">
                    <a href="${item.repository.url}" target="_blank">${item.repository.name}</a>
                  </span>
                  <span class="activity-commit-count">${item.contributions.totalCount} commits</span>
                </div>
              `
              )
              .join("")}
          </div>
        </div>
      `;

      detailedActivitySection.appendChild(commitContributions);
    }

    // Display pull request contributions by repository
    if (
      data.pullRequestContributionsByRepository &&
      data.pullRequestContributionsByRepository.length > 0
    ) {
      const prContributions = document.createElement("div");
      prContributions.className = "detailed-activity-item";

      const icon =
        '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="18" r="3"></circle><circle cx="6" cy="6" r="3"></circle><path d="M6 21V9a9 9 0 0 0 9 9"></path></svg>';

      prContributions.innerHTML = `
        <div class="activity-icon">${icon}</div>
        <div class="activity-content">
          <div class="activity-header">Pull Request Contributions</div>
          <div class="activity-details">
            ${data.pullRequestContributionsByRepository
              .map(
                (item) => `
                <div class="activity-repo-item">
                  <span class="activity-repo-name">
                    <a href="${item.repository.url}" target="_blank">${item.repository.name}</a>
                  </span>
                  <span class="activity-commit-count">${item.contributions.totalCount} PRs</span>
                </div>
              `
              )
              .join("")}
          </div>
        </div>
      `;

      detailedActivitySection.appendChild(prContributions);
    }

    // Display issue contributions by repository
    if (
      data.issueContributionsByRepository &&
      data.issueContributionsByRepository.length > 0
    ) {
      const issueContributions = document.createElement("div");
      issueContributions.className = "detailed-activity-item";

      const icon =
        '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>';

      issueContributions.innerHTML = `
        <div class="activity-icon">${icon}</div>
        <div class="activity-content">
          <div class="activity-header">Issue Contributions</div>
          <div class="activity-details">
            ${data.issueContributionsByRepository
              .map(
                (item) => `
                <div class="activity-repo-item">
                  <span class="activity-repo-name">
                    <a href="${item.repository.url}" target="_blank">${item.repository.name}</a>
                  </span>
                  <span class="activity-commit-count">${item.contributions.totalCount} issues</span>
                </div>
              `
              )
              .join("")}
          </div>
        </div>
      `;

      detailedActivitySection.appendChild(issueContributions);
    }
  } catch (error) {
    console.error("Error fetching detailed activity:", error);
    // Don't show an error message here, as this is supplementary data
  }
}

// Fetch real contribution data from GitHub API using the new GraphQL endpoint
async function fetchContributions() {
  try {
    // Show loading state
    contributionGraph.innerHTML =
      '<div class="loading">Loading contribution data...</div>';
    totalContributions.textContent = "...";

    const contributionData = await fetchWithErrorHandling(CONTRIBUTIONS_URL);

    // Update the total contributions count
    const totalCount = contributionData.totalContributions || 0;
    totalContributions.textContent = totalCount.toString();

    // Generate the contribution graph based on real data
    generateContributionGraph(contributionData.contributions || []);

    // Add a message to indicate scrolling on mobile
    if (window.innerWidth <= 768) {
      const scrollHint = document.createElement("div");
      scrollHint.className = "scroll-hint";
      scrollHint.textContent = "Scroll horizontally to view all contributions";
      scrollHint.style.textAlign = "center";
      scrollHint.style.fontSize = "12px";
      scrollHint.style.color = "var(--text-light, #586069)";
      scrollHint.style.marginTop = "5px";
      contributionGraph.appendChild(scrollHint);
    }
  } catch (error) {
    console.error("Error fetching contributions:", error);
    // Fallback to mock data if real data can't be fetched
    generateEnhancedContributionGraph();
    totalContributions.textContent = "N/A";
  }
}

// Generate the contribution graph from real data
function generateContributionGraph(contributions) {
  try {
    // Clear the contribution graph
    contributionGraph.innerHTML = "";

    // Create month labels
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const monthLabels = document.createElement("div");
    monthLabels.className = "month-labels";

    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const monthIndex = (now.getMonth() - 11 + i + 12) % 12;
      const monthLabel = document.createElement("div");
      monthLabel.className = "month-label";
      monthLabel.textContent = months[monthIndex];
      monthLabels.appendChild(monthLabel);
    }

    contributionGraph.appendChild(monthLabels);

    // Create the contribution cells grid
    const cellsContainer = document.createElement("div");
    cellsContainer.className = "contribution-cells";

    // Generate cells based on contributions data
    const today = new Date();
    const oneYearAgo = new Date(today);
    oneYearAgo.setFullYear(today.getFullYear() - 1);

    // Create a map of dates to contribution counts
    const contributionMap = new Map();
    contributions.forEach((contribution) => {
      contributionMap.set(contribution.date, contribution.count);
    });

    // Generate cells for the past year
    for (let week = 0; week < 52; week++) {
      for (let day = 0; day < 7; day++) {
        const date = new Date(today);
        date.setDate(today.getDate() - (52 - week) * 7 - (6 - day));

        // Format date as YYYY-MM-DD for lookup
        const dateString = date.toISOString().split("T")[0];

        // Get contribution count for this date
        const count = contributionMap.get(dateString) || 0;

        // Determine level based on count
        let level = 0;
        if (count > 0) {
          if (count < 3) level = 1;
          else if (count < 6) level = 2;
          else if (count < 10) level = 3;
          else level = 4;
        }

        const cell = document.createElement("div");
        cell.className = `contribution-cell level-${level}`;
        cell.title = `${count} contributions on ${date.toDateString()}`;
        cellsContainer.appendChild(cell);
      }
    }

    contributionGraph.appendChild(cellsContainer);

    // Add legend
    const legend = document.createElement("div");
    legend.className = "contribution-legend";
    legend.innerHTML = `
      <span>Less</span>
      <div class="legend-cells">
        <div class="legend-cell level-0"></div>
        <div class="legend-cell level-1"></div>
        <div class="legend-cell level-2"></div>
        <div class="legend-cell level-3"></div>
        <div class="legend-cell level-4"></div>
      </div>
      <span>More</span>
    `;

    contributionGraph.appendChild(legend);
  } catch (error) {
    console.error("Error generating contribution graph:", error);
    // Fallback to the enhanced mock data
    generateEnhancedContributionGraph();
  }
}

// Emoji mapping for markdown rendering
const emojiMap = {
  ":smile:": "😄",
  ":laughing:": "😆",
  ":blush:": "😊",
  ":smiley:": "😃",
  ":relaxed:": "☺️",
  ":smirk:": "😏",
  ":heart:": "❤️",
  ":thumbsup:": "👍",
  ":thumbsdown:": "👎",
  ":+1:": "👍",
  ":-1:": "👎",
  ":rocket:": "🚀",
  ":fire:": "🔥",
  ":tada:": "🎉",
  ":sparkles:": "✨",
  ":star:": "⭐",
  ":star2:": "🌟",
  ":eyes:": "👀",
  ":raised_hands:": "🙌",
  ":ok_hand:": "👌",
  ":wave:": "👋",
  ":clap:": "👏",
  ":muscle:": "💪",
  ":metal:": "🤘",
  ":pray:": "🙏",
  ":point_up:": "☝️",
  ":point_down:": "👇",
  ":point_left:": "👈",
  ":point_right:": "👉",
  ":100:": "💯",
  ":white_check_mark:": "✅",
  ":heavy_check_mark:": "✔️",
  ":x:": "❌",
  ":heavy_multiplication_x:": "✖️",
  ":warning:": "⚠️",
  ":zap:": "⚡",
  ":recycle:": "♻️",
  ":gear:": "⚙️",
  ":link:": "🔗",
  ":bulb:": "💡",
  ":book:": "📖",
  ":bookmark:": "🔖",
  ":computer:": "💻",
  ":desktop_computer:": "🖥️",
  ":keyboard:": "⌨️",
  ":bar_chart:": "📊",
  ":chart_with_upwards_trend:": "📈",
  ":chart_with_downwards_trend:": "📉",
  ":calendar:": "📆",
  ":date:": "📅",
  ":clock3:": "🕒",
  ":hourglass:": "⌛",
  ":hourglass_flowing_sand:": "⏳",
  ":lock:": "🔒",
  ":unlock:": "🔓",
  ":key:": "🔑",
  ":mag:": "🔍",
  ":mag_right:": "🔎",
  ":bell:": "🔔",
  ":no_bell:": "🔕",
  ":pushpin:": "📌",
  ":paperclip:": "📎",
  ":pencil2:": "✏️",
  ":black_nib:": "✒️",
  ":memo:": "📝",
  ":email:": "📧",
  ":mailbox:": "📫",
  ":inbox_tray:": "📥",
  ":outbox_tray:": "📤",
  ":package:": "📦",
  ":closed_book:": "📕",
  ":green_book:": "📗",
  ":blue_book:": "📘",
  ":orange_book:": "📙",
  ":notebook:": "📓",
  ":ledger:": "📒",
  ":page_with_curl:": "📃",
  ":page_facing_up:": "📄",
  ":bookmark_tabs:": "📑",
  ":clipboard:": "📋",
  ":file_folder:": "📁",
  ":open_file_folder:": "📂",
  ":card_index:": "📇",
  ":chart:": "💹",
  ":newspaper:": "📰",
  ":telephone:": "☎️",
  ":phone:": "📱",
  ":iphone:": "📱",
  ":calling:": "📲",
  ":camera:": "📷",
  ":video_camera:": "📹",
  ":tv:": "📺",
  ":radio:": "📻",
  ":speaker:": "🔈",
  ":sound:": "🔉",
  ":loud_sound:": "🔊",
  ":mute:": "🔇",
  ":bell:": "🔔",
  ":no_bell:": "🔕",
  ":mega:": "📣",
  ":loudspeaker:": "📢",
  ":speech_balloon:": "💬",
  ":thought_balloon:": "💭",
  ":anger:": "💢",
  ":boom:": "💥",
  ":zzz:": "💤",
  ":dash:": "💨",
  ":sweat_drops:": "💦",
  ":notes:": "🎶",
  ":musical_note:": "🎵",
  ":fire:": "🔥",
  ":hankey:": "💩",
  ":poop:": "💩",
  ":shit:": "💩",
  ":+1:": "👍",
  ":-1:": "👎",
};

// Function to render emojis in markdown
function renderEmojisInMarkdown(markdown) {
  // Replace emoji codes with actual emojis
  let processedMarkdown = markdown;

  // Replace GitHub-style emoji references like :emoji:
  processedMarkdown = processedMarkdown.replace(
    /:([a-z0-9_+-]+):/g,
    (match, emojiName) => {
      return emojiMap[`:${emojiName}:`] || match;
    }
  );

  return processedMarkdown;
}

// Generate a more realistic contribution graph (fallback)
function generateEnhancedContributionGraph() {
  try {
    // Clear the contribution graph
    contributionGraph.innerHTML = "";

    // Create month labels
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const monthLabels = document.createElement("div");
    monthLabels.className = "month-labels";

    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const monthIndex = (now.getMonth() - 11 + i + 12) % 12;
      const monthLabel = document.createElement("div");
      monthLabel.className = "month-label";
      monthLabel.textContent = months[monthIndex];
      monthLabels.appendChild(monthLabel);
    }

    contributionGraph.appendChild(monthLabels);

    // Create the contribution cells grid
    const cellsContainer = document.createElement("div");
    cellsContainer.className = "contribution-cells";

    // Generate 52 weeks (1 year) of contribution cells with a more realistic pattern
    const today = new Date();
    const contributionPattern = generateRealisticContributionPattern();
    let cellIndex = 0;

    for (let week = 0; week < 52; week++) {
      for (let day = 0; day < 7; day++) {
        const date = new Date(today);
        date.setDate(today.getDate() - (52 - week) * 7 - (6 - day));

        // Get level from pattern or generate random
        let level = 0;
        if (cellIndex < contributionPattern.length) {
          level = contributionPattern[cellIndex];
        } else {
          // Fallback to random
          const randomValue = Math.random();
          const recencyFactor = week / 52; // 0 to 1, higher for more recent weeks

          if (randomValue < 0.1 + recencyFactor * 0.2) {
            level = Math.floor(Math.random() * 4) + 1; // Levels 1-4
          }
        }

        const cell = document.createElement("div");
        cell.className = `contribution-cell level-${level}`;
        cell.title = `${level} contributions on ${date.toDateString()}`;
        cellsContainer.appendChild(cell);

        cellIndex++;
      }
    }

    contributionGraph.appendChild(cellsContainer);

    // Add legend
    const legend = document.createElement("div");
    legend.className = "contribution-legend";
    legend.innerHTML = `
      <span>Less</span>
      <div class="legend-cells">
        <div class="legend-cell level-0"></div>
        <div class="legend-cell level-1"></div>
        <div class="legend-cell level-2"></div>
        <div class="legend-cell level-3"></div>
        <div class="legend-cell level-4"></div>
      </div>
      <span>More</span>
    `;

    contributionGraph.appendChild(legend);
  } catch (error) {
    console.error("Error generating contribution graph:", error);
    contributionGraph.innerHTML =
      '<div class="error-message">Could not generate contribution graph</div>';
  }
}

// Generate a more realistic contribution pattern
function generateRealisticContributionPattern() {
  // Create a pattern with clusters of activity
  const pattern = new Array(364).fill(0);

  // Add some regular activity patterns
  for (let i = 0; i < pattern.length; i++) {
    // More activity on weekdays (positions 0-4 in each week)
    const dayOfWeek = i % 7;
    if (dayOfWeek < 5) {
      // Weekday - higher chance of activity
      if (Math.random() < 0.2) {
        pattern[i] = Math.floor(Math.random() * 3) + 1; // Levels 1-3
      }
    } else {
      // Weekend - lower chance of activity
      if (Math.random() < 0.1) {
        pattern[i] = Math.floor(Math.random() * 2) + 1; // Levels 1-2
      }
    }
  }

  // Add some "hot streaks" - periods of high activity
  const numStreaks = 3 + Math.floor(Math.random() * 4); // 3-6 streaks

  for (let streak = 0; streak < numStreaks; streak++) {
    const startIndex = Math.floor(Math.random() * (pattern.length - 14));
    const streakLength = 7 + Math.floor(Math.random() * 8); // 7-14 days

    for (let i = 0; i < streakLength; i++) {
      if (startIndex + i < pattern.length) {
        // Higher activity during streaks
        pattern[startIndex + i] = Math.floor(Math.random() * 3) + 2; // Levels 2-4
      }
    }
  }

  // Add more recent activity (last 30 days)
  for (let i = pattern.length - 30; i < pattern.length; i++) {
    if (i >= 0 && Math.random() < 0.3) {
      pattern[i] = Math.floor(Math.random() * 4) + 1; // Levels 1-4
    }
  }

  return pattern;
}

// Fetch language statistics using the new GraphQL endpoint
async function fetchLanguageStats() {
  try {
    if (!languagesContainer) return;

    languagesContainer.innerHTML =
      '<div class="loading">Loading language statistics...</div>';

    const languageData = await fetchWithErrorHandling(LANGUAGES_URL);

    // Clear loading message
    languagesContainer.innerHTML = "";

    // Check if there are any languages
    if (!languageData || languageData.length === 0) {
      showEmptyState(
        languagesContainer,
        "No language data",
        "This user doesn't have any repositories with detectable languages."
      );
      return;
    }

    // Create language bar
    const languageBar = document.createElement("div");
    languageBar.className = "language-bar";

    // Create language list
    const languageList = document.createElement("div");
    languageList.className = "language-list";

    // Add segments to language bar (top 5 languages)
    const topLanguages = languageData.slice(0, 5);

    topLanguages.forEach((language) => {
      // Add segment to language bar
      const segment = document.createElement("div");
      segment.className = "language-segment";
      segment.style.width = `${language.percentage}%`;
      segment.style.backgroundColor = language.color || "#8b949e"; // Default color
      segment.title = `${language.name}: ${language.percentage}%`;
      languageBar.appendChild(segment);

      // Add language to list
      const languageItem = document.createElement("div");
      languageItem.className = "language-item";
      languageItem.innerHTML = `
        <span class="language-color" style="background-color: ${
          language.color || "#8b949e"
        }"></span>
        <span class="language-name">${language.name}</span>
        <span class="language-percentage">${language.percentage}%</span>
      `;
      languageList.appendChild(languageItem);
    });

    // Add to container
    languagesContainer.appendChild(languageBar);
    languagesContainer.appendChild(languageList);
  } catch (error) {
    console.error("Error fetching language statistics:", error);
    if (languagesContainer) {
      languagesContainer.innerHTML =
        '<div class="error-message">Could not load language statistics. Please try again later.</div>';
    }
  }
}

// Repository Viewer Functions

// Open the repository viewer
function openRepositoryViewer(repoName, defaultBranch = "main") {
  currentRepo = repoName;
  currentPath = "";
  currentBranch = defaultBranch;

  // Update the title
  repoViewerTitle.textContent = repoName;

  // Reset the breadcrumb
  updateBreadcrumb();

  // Fetch repository contents
  fetchRepositoryContents(repoName, currentPath, currentBranch);

  // Show the modal
  repoViewerModal.style.display = "block";

  // Prevent scrolling on the body
  document.body.style.overflow = "hidden";
}

// Fetch repository contents with better error handling
async function fetchRepositoryContents(repo, path, branch) {
  try {
    // Show loading state
    repoViewerFiles.innerHTML = '<div class="loading">Loading files...</div>';
    repoViewerFileContent.innerHTML =
      '<div class="repo-viewer-placeholder"><div class="repo-viewer-placeholder-icon">📁</div><p>Select a file to view its contents</p></div>';
    repoViewerFileHeader.innerHTML = "";

    // Construct the API URL
    let apiPath = `repos/${GITHUB_USERNAME}/${repo}/contents`;
    if (path) {
      apiPath += `/${path}`;
    }
    apiPath += `?ref=${branch}`;

    console.log(`Fetching repository contents: ${apiPath}`);

    const response = await fetch(`${SERVER_URL}/api/github/${apiPath}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `Error fetching repository contents: ${response.status} ${response.statusText}`
      );
      console.error(`Response: ${errorText}`);

      // Show a user-friendly error message
      repoViewerFiles.innerHTML = `
        <div class="error-message">
          <h3>Repository Not Found</h3>
          <p>The repository "${repo}" could not be found or is not accessible.</p>
          <p>This could be because:</p>
          <ul>
            <li>The repository is private</li>
            <li>The repository doesn't exist</li>
            <li>There's an issue with the GitHub API access</li>
          </ul>
        </div>
      `;
      return;
    }

    const contents = await response.json();

    // Clear the files list
    repoViewerFiles.innerHTML = "";

    // Sort contents: directories first, then files
    const sortedContents = Array.isArray(contents)
      ? contents.sort((a, b) => {
          if (a.type === "dir" && b.type !== "dir") return -1;
          if (a.type !== "dir" && b.type === "dir") return 1;
          return a.name.localeCompare(b.name);
        })
      : [contents]; // If it's a single file, wrap it in an array

    // Add each item to the files list
    sortedContents.forEach((item) => {
      const fileItem = document.createElement("div");
      fileItem.className = "file-item";

      let icon;
      if (item.type === "dir") {
        icon =
          '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>';
      } else {
        icon =
          '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>';
      }

      fileItem.innerHTML = `
        <div class="file-icon">${icon}</div>
        <div class="file-name">${item.name}</div>
      `;

      // Add click event
      fileItem.addEventListener("click", () => {
        if (item.type === "dir") {
          // Navigate to directory
          currentPath = item.path;
          updateBreadcrumb();
          fetchRepositoryContents(currentRepo, item.path, currentBranch);
        } else {
          // View file
          viewFile(item);
        }
      });

      repoViewerFiles.appendChild(fileItem);
    });

    // Check for README.md file and display it automatically
    const readmeFile = Array.isArray(sortedContents)
      ? sortedContents.find((item) => item.name.toLowerCase() === "readme.md")
      : null;

    // If it's a single file, view it automatically
    if (
      !Array.isArray(contents) ||
      (Array.isArray(contents) &&
        contents.length === 1 &&
        contents[0].type !== "dir")
    ) {
      viewFile(Array.isArray(contents) ? contents[0] : contents);
    }
    // If there's a README.md file, view it automatically
    else if (readmeFile) {
      viewFile(readmeFile);
    }
  } catch (error) {
    console.error("Error fetching repository contents:", error);
    repoViewerFiles.innerHTML = `
      <div class="error-message">
        <h3>Error Loading Repository</h3>
        <p>Could not load repository contents. Please try again later.</p>
        <p>Error details: ${error.message}</p>
      </div>
    `;
  }
}

// Close the repository viewer
function closeRepositoryViewer() {
  repoViewerModal.style.display = "none";
  document.body.style.overflow = "";
}

// Update the breadcrumb navigation
function updateBreadcrumb() {
  repoViewerBreadcrumb.innerHTML = "";

  // Add the repository name
  const repoItem = document.createElement("span");
  repoItem.className = "breadcrumb-item";
  repoItem.textContent = currentRepo;
  repoItem.addEventListener("click", () => {
    currentPath = "";
    updateBreadcrumb();
    fetchRepositoryContents(currentRepo, "", currentBranch);
  });
  repoViewerBreadcrumb.appendChild(repoItem);

  // Add path segments
  if (currentPath) {
    const segments = currentPath.split("/");
    let path = "";

    segments.forEach((segment, index) => {
      // Add separator
      const separator = document.createElement("span");
      separator.className = "breadcrumb-separator";
      separator.textContent = " / ";
      repoViewerBreadcrumb.appendChild(separator);

      // Add path segment
      const segmentItem = document.createElement("span");
      segmentItem.className = "breadcrumb-item";
      segmentItem.textContent = segment;

      // Build the path for this segment
      path += (index > 0 ? "/" : "") + segment;

      // Only make it clickable if it's not the last segment
      if (index < segments.length - 1) {
        const segmentPath = path;
        segmentItem.addEventListener("click", () => {
          currentPath = segmentPath;
          updateBreadcrumb();
          fetchRepositoryContents(currentRepo, segmentPath, currentBranch);
        });
      }

      repoViewerBreadcrumb.appendChild(segmentItem);
    });
  }
}

// View a file
async function viewFile(file) {
  try {
    // Update file header
    repoViewerFileHeader.innerHTML = `
            <div>${file.name}</div>
        `;

    // Show loading state
    repoViewerFileContent.innerHTML =
      '<div class="loading">Loading file content...</div>';

    // Check if it's a binary file
    if (isBinaryFile(file.name)) {
      if (isImageFile(file.name)) {
        // Display image
        repoViewerFileContent.innerHTML = `
                    <div class="image-viewer">
                        <img src="${file.download_url}" alt="${file.name}" />
                    </div>
                `;
      } else {
        // Binary file that can't be displayed
        repoViewerFileContent.innerHTML = `
                    <div class="repo-viewer-placeholder">
                        <div class="repo-viewer-placeholder-icon">📦</div>
                        <p>This is a binary file and cannot be displayed. <a href="${file.download_url}" target="_blank">Download</a> to view.</p>
                    </div>
                `;
      }
      return;
    }

    // Fetch file content
    const response = await fetch(
      `${SERVER_URL}/api/github/repos/${GITHUB_USERNAME}/${currentRepo}/contents/${file.path}?ref=${currentBranch}`
    );
    if (!response.ok) throw new Error("Failed to fetch file content");

    const fileData = await response.json();
    const content = atob(fileData.content); // Decode base64 content

    // Determine how to display the file
    if (isMarkdownFile(file.name)) {
      // For README.md files, use the enhanced rendering endpoint
      try {
        const renderedResponse = await fetch(
          `${SERVER_URL}/api/github/repos/${GITHUB_USERNAME}/${currentRepo}/readme/rendered`
        );

        if (renderedResponse.ok) {
          const renderedHTML = await renderedResponse.text();
          repoViewerFileContent.innerHTML = `<div class="markdown-viewer">${renderedHTML}</div>`;
          return;
        }
      } catch (renderError) {
        console.error("Error using enhanced README rendering:", renderError);
        // Fall back to basic rendering below
      }

      // Process markdown content to support emojis
      const processedContent = renderEmojisInMarkdown(content);

      // Render markdown with emoji support
      repoViewerFileContent.innerHTML = `<div class="markdown-viewer">${window.marked.parse(
        processedContent
      )}</div>`;
    } else {
      // Display as code with syntax highlighting
      const language = getLanguageFromFilename(file.name);
      repoViewerFileContent.innerHTML = `<pre class="code-viewer"><code class="language-${language}">${escapeHtml(
        content
      )}</code></pre>`;

      // Apply syntax highlighting
      document.querySelectorAll("pre code").forEach((block) => {
        window.hljs.highlightElement(block);
      });
    }
  } catch (error) {
    console.error("Error viewing file:", error);
    repoViewerFileContent.innerHTML =
      '<div class="error-message">Could not load file content</div>';
  }
}

// Helper function to check if a file is binary
function isBinaryFile(filename) {
  const binaryExtensions = [
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".bmp",
    ".ico",
    ".svg",
    ".pdf",
    ".doc",
    ".docx",
    ".xls",
    ".xlsx",
    ".ppt",
    ".pptx",
    ".zip",
    ".rar",
    ".tar",
    ".gz",
    ".7z",
    ".exe",
    ".dll",
    ".so",
    ".dylib",
    ".ttf",
    ".otf",
    ".woff",
    ".woff2",
    ".mp3",
    ".mp4",
    ".avi",
    ".mov",
    ".wmv",
    ".psd",
    ".ai",
    ".sketch",
  ];

  return binaryExtensions.some((ext) => filename.toLowerCase().endsWith(ext));
}

// Helper function to check if a file is an image
function isImageFile(filename) {
  const imageExtensions = [
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".bmp",
    ".ico",
    ".svg",
  ];
  return imageExtensions.some((ext) => filename.toLowerCase().endsWith(ext));
}

// Helper function to check if a file is markdown
function isMarkdownFile(filename) {
  const markdownExtensions = [".md", ".markdown"];
  return markdownExtensions.some((ext) => filename.toLowerCase().endsWith(ext));
}

// Helper function to get language for syntax highlighting
function getLanguageFromFilename(filename) {
  const extension = filename.split(".").pop().toLowerCase();

  const languageMap = {
    js: "javascript",
    jsx: "javascript",
    ts: "typescript",
    tsx: "typescript",
    html: "html",
    css: "css",
    scss: "scss",
    sass: "sass",
    less: "less",
    py: "python",
    rb: "ruby",
    java: "java",
    c: "c",
    cpp: "cpp",
    cs: "csharp",
    go: "go",
    php: "php",
    swift: "swift",
    kt: "kotlin",
    rs: "rust",
    sh: "bash",
    bat: "batch",
    ps1: "powershell",
    sql: "sql",
    json: "json",
    xml: "xml",
    yaml: "yaml",
    yml: "yaml",
    toml: "toml",
    md: "markdown",
    markdown: "markdown",
  };

  return languageMap[extension] || "plaintext";
}

// Helper function to escape HTML
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// Helper function to show empty state
function showEmptyState(container, title, message) {
  container.innerHTML = `
        <div class="empty-state">
            <div class="empty-state-icon">📦</div>
            <h3>${title}</h3>
            <p>${message}</p>
        </div>
    `;
}

// Helper function to show error message
function showError(message) {
  const errorElement = document.createElement("div");
  errorElement.className = "error-message";
  errorElement.textContent = message;

  // Insert at the top of the container
  const container = document.querySelector(".github-container");
  container.insertBefore(errorElement, container.firstChild);

  // Remove after 5 seconds
  setTimeout(() => {
    errorElement.remove();
  }, 5000);
}

// Helper function to format time ago
function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);

  let interval = Math.floor(seconds / 31536000);
  if (interval > 1) return interval + " years ago";
  if (interval === 1) return "1 year ago";

  interval = Math.floor(seconds / 2592000);
  if (interval > 1) return interval + " months ago";
  if (interval === 1) return "1 month ago";

  interval = Math.floor(seconds / 86400);
  if (interval > 1) return interval + " days ago";
  if (interval === 1) return "1 day ago";

  interval = Math.floor(seconds / 3600);
  if (interval > 1) return interval + " hours ago";
  if (interval === 1) return "1 hour ago";

  interval = Math.floor(seconds / 60);
  if (interval > 1) return interval + " minutes ago";
  if (interval === 1) return "1 minute ago";

  return "just now";
}

// Event listeners
if (repoViewerClose) {
  repoViewerClose.addEventListener("click", closeRepositoryViewer);
}

// Close modal when clicking outside the content
if (repoViewerModal) {
  repoViewerModal.addEventListener("click", (event) => {
    if (event.target === repoViewerModal) {
      closeRepositoryViewer();
    }
  });
}

// Add a function to handle the active state of the "Coding Projects" category
function highlightActiveCategory() {
  // Find all portfolio category links
  const categoryLinks = document.querySelectorAll(".portfolio-category");

  // Loop through them and add active class to "Coding Projects"
  categoryLinks.forEach((link) => {
    if (link.textContent.trim() === "Coding Projects") {
      link.classList.add("active");
    }
  });

  // Also highlight "Coding Projects" in the breadcrumb
  const breadcrumbItems = document.querySelectorAll(
    ".breadcrumb-navigation span"
  );
  breadcrumbItems.forEach((item) => {
    if (item.textContent.trim() === "Coding Projects") {
      item.classList.add("current");
    }
  });
}

// Initialize the page
function init() {
  fetchProfile();
  fetchRepositories();
  fetchPinnedRepositories(); // New function to fetch pinned repos
  fetchActivity();
  fetchLanguageStats();
  fetchContributions();
}

// Call this function after the page loads
document.addEventListener("DOMContentLoaded", () => {
  init();
  highlightActiveCategory();

  // Add viewport meta tag for proper mobile rendering
  if (!document.querySelector('meta[name="viewport"]')) {
    const viewportMeta = document.createElement("meta");
    viewportMeta.name = "viewport";
    viewportMeta.content =
      "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no";
    document.head.appendChild(viewportMeta);
  }
});
