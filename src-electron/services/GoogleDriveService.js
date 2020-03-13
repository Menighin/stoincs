import fs from 'fs';
import readline from 'readline';
import { google } from 'googleapis';
import GoogleCredentials from '../resources/GoogleCredentials';

const SCOPES = ['https://www.googleapis.com/auth/drive.metadata.readonly'];
const TOKEN_PATH = 'token.json';

class GoogleDriveService {

    async getLoginUrl() {
        const { clientSecret, clientId, redirectUris } = GoogleCredentials.installed;
        const oAuth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUris[0]);
        const url = oAuth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: SCOPES
        });

        return url;
    }

    async listFiles() {
        const { clientSecret, clientId, redirectUris } = GoogleCredentials.installed;
        const oAuth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUris[0]);

        // Check if we have previously stored a token.
        // fs.readFile(TOKEN_PATH, (err, token) => {
        //     if (err) return getAccessToken(oAuth2Client, callback);
        //     oAuth2Client.setCredentials(JSON.parse(token));
        //     callback(oAuth2Client);
        // });

        const authUrl = oAuth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: SCOPES
        });
    }

}

export default GoogleDriveService;
