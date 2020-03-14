import fs from 'fs';
import readline from 'readline';
import { google } from 'googleapis';
import GoogleCredentials from '../resources/GoogleCredentials';
import opn from 'open';
import express from 'express';

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

        const app = express();
        app.get('/oauth2callback', (req, res) => {
            console.log('DEU CERTO!');
            console.log(res);
            const code = req.query.code;
            oAuth2Client.getToken(code, (err, tokens) => {
                if (err) {
                    console.error('Error getting oAuth tokens:');
                    throw err;
                }
                oAuth2Client.credentials = tokens;
                res.send('Authentication successful! Please return to the console.');
                server.close();
            });
        });
        const server = app.listen(3000, () => {
            // open the browser to the authorize url to start the workflow
            opn(url, { wait: false });
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
