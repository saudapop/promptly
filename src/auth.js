const fs = window.require("fs");
const { google } = window.require("googleapis");
const path = window.require("path");
const { remote } = window.require("electron");

const app = remote.app;
// If modifying these scopes, delete token.json.
const SCOPES = ["https://www.googleapis.com/auth/calendar.readonly"];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.

// const TOKEN_PATH = "token.json";
// const CREDENTIALS_PATH = "credentials.json";

const TOKEN_PATH = path.join(app.getPath("userData"), "token.json");

const creds = require("./credentials.json");

export async function login() {
  // Authorize a client with credentials, then call the Google Calendar API.
  try {
    // const creds = fs.readFileSync(CREDENTIALS_PATH);
    // return authorize(JSON.parse(creds));
    return authorize(creds);
  } catch (error) {
    return Promise.reject({ error });
  }
}

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 */
async function authorize(credentials) {
  const { client_secret, client_id, redirect_uris } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );
  // Check if we have previously stored a token.
  try {
    const tokenFile = await fs.readFileSync(TOKEN_PATH);
    const { tokens } = JSON.parse(tokenFile);
    oAuth2Client.setCredentials(tokens);
    return { oAuth2Client };
  } catch (error) {
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: "offline",
      scope: SCOPES,
    });

    return { authUrl, oAuth2Client };
  }
}

export async function submitAccessCodeAndGetAccessToken(oAuth2Client, code) {
  try {
    const token = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(token);
    // Store the token to disk for later program executions
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(token));
    console.log("Token stored to", TOKEN_PATH);
    return { oAuth2Client };
  } catch (error) {
    console.log(error);
    return Promise.reject({ error });
  }
}

// module.exports = { login, submitAccessCodeAndGetAccessToken };
