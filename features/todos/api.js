import { PublicClientApplication } from '@azure/msal-browser';

const redirectUri = typeof chrome !== "undefined" && chrome.identity ? chrome.identity.getRedirectURL() : `${window.location.origin}/index.html`;

const msalInstance = new PublicClientApplication({
  auth: {
    authority: "https://login.microsoftonline.com/common/",
    clientId: `${import.meta.env.SNOWPACK_PUBLIC_MSGRAPH_CLIENT_ID}`,
    redirectUri,
    postLogoutRedirectUri: redirectUri
  },
  cache: {
    cacheLocation: "localStorage"
  },
});

const accounts = msalInstance.getAllAccounts()

export const getAllAccounts = () => accounts;

export async function signIn() {
  const url = await getLoginUrl();
  await launchWebAuthFlow(url);
}

export async function fetchTaskLists() {
  return callMSGraph('https://graph.microsoft.com/v1.0/me/todo/lists');
}

export async function fetchTasks(todoTaskListId) {
  return callMSGraph(`https://graph.microsoft.com/v1.0/me/todo/lists/${todoTaskListId}/tasks`);
}

export async function moveTaskToCompleted(todoTaskListId, taskId) {
  return callMSGraph(`https://graph.microsoft.com/v1.0/me/todo/lists/${todoTaskListId}/tasks/${taskId}`, 'PATCH', { status: 'completed' });
}

export async function moveTaskToNotStarted(todoTaskListId, taskId) {
  return callMSGraph(`https://graph.microsoft.com/v1.0/me/todo/lists/${todoTaskListId}/tasks/${taskId}`, 'PATCH', { status: 'notStarted' });
}

export async function removeTask(todoTaskListId, taskId) {
  return callMSGraph(`https://graph.microsoft.com/v1.0/me/todo/lists/${todoTaskListId}/tasks/${taskId}`, 'DELETE');
}

export async function fetchOneTask(todoTaskListId, taskId) {
  return callMSGraph(`https://graph.microsoft.com/v1.0/me/todo/lists/${todoTaskListId}/tasks/${taskId}`);
}

export async function fetchCompletedTasks(todoTaskListId) {
  return callMSGraph(`https://graph.microsoft.com/v1.0/me/todo/lists/${todoTaskListId}/tasks?$filter=status eq 'completed'`);
}

async function callMSGraph(endpoint, method, body) {
  method = method || "GET";
  const {
    accessToken
  } = await acquireToken({
    scopes: ["Tasks.ReadWrite"],
    account: msalInstance.getAllAccounts()[0]
  });

  const headers = new Headers();
  const bearer = `Bearer ${accessToken}`;

  headers.append("Authorization", bearer);
  headers.append("Content-Type", "application/json");

  const options = {
    method,
    headers
  };

  if (body) {
    options["body"] = JSON.stringify(body);
  }

  return fetch(endpoint, options).then(response => {
    if (response.status == 204) {
      return Promise.resolve();
    } else if (response.ok) {
      return response.json();
    } else {
      throw new Error(response);
    }
  })
}

/**
 * Generates a login url
 */
async function getLoginUrl() {
  return new Promise((resolve, reject) => {
    msalInstance.loginRedirect({
      onRedirectNavigate: (url) => {
        resolve(url);
        return false;
      }
    }).catch(reject)
  });
}

/**
 * Launch the Chromium web auth UI.
 * 
 * @param {*} url AAD url to navigate to.
 * @param {*} interactive Whether or not the flow is interactive
 */
async function launchWebAuthFlow(url) {
  return new Promise((resolve, reject) => {
    chrome.identity.launchWebAuthFlow({
      interactive: true,
      url,
    }, (responseUrl) => {
      if (chrome.runtime.lastError) {
        msalInstance.handleRedirectPromise();
        reject(chrome.runtime.lastError.message);
      } else if (responseUrl.includes("#")) {
        msalInstance.handleRedirectPromise(`#${responseUrl.split("#")[1]}`)
          .then(resolve).catch(reject);
      } else {
        console.error('Unknown error when launching WebAuthFlow...');
      }
    })
  })
}

/**
 * Attempts to silent acquire an access token, falling back to interactive.
 */
async function acquireToken(request) {
  return msalInstance.acquireTokenSilent(request)
    .catch(async (error) => {
      console.error(error);
      const acquireTokenUrl = await getAcquireTokenUrl(request);

      return launchWebAuthFlow(acquireTokenUrl);
    })
}

/**
* Generates an acquire token url
*/
async function getAcquireTokenUrl(request) {
  return new Promise((resolve, reject) => {
    msalInstance.acquireTokenRedirect({
      ...request,
      onRedirectNavigate: (url) => {
        resolve(url);
        return false;
      }
    }).catch(reject);
  });
}
