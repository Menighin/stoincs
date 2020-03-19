import fs from 'fs';
import readline from 'readline';
import { google } from 'googleapis';
import GoogleCredentials from '../resources/GoogleCredentials';
import opn from 'open';
import express from 'express';
import FileSystemUtils from '../utils/FileSystemUtils';

const SCOPES = [
    'https://www.googleapis.com/auth/drive.metadata.readonly',
    'https://www.googleapis.com/auth/userinfo.profile'
];
const TOKEN_FILE = 'token.json';

class GoogleDriveService {

    async getLoginUrl() {
        const { clientSecret, clientId, redirectUris } = GoogleCredentials.installed;
        const oAuth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUris[1]);
        const url = oAuth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: SCOPES
        });

        const path = `${await FileSystemUtils.getDataPath()}/${TOKEN_FILE}`;

        const tokenStr = (await fs.promises.readFile(path, { flag: 'a+', encoding: 'utf-8' })).toString();
        console.log(`TOKENSTR: ${tokenStr}`);
        if (tokenStr.length > 0) {
            oAuth2Client.credentials = JSON.parse(tokenStr);
            await this.listFiles(oAuth2Client);
            await this.getPicture(oAuth2Client);
        } else {
            const app = express();
            app.get('/oauth2callback', async (req, res) => {
                console.log('DEU CERTO!');
                console.log(req.query.code);
                const code = req.query.code;
                oAuth2Client.getToken(code, async (err, tokens) => {
                    if (err) {
                        console.error('Error getting oAuth tokens:');
                        throw err;
                    }
                    oAuth2Client.credentials = tokens;
                    await fs.promises.writeFile(path, JSON.stringify(tokens));
                    res.send('Authentication successful! Please return to the console.');
                    server.close();
                    await this.listFiles(oAuth2Client);
                    await this.getPicture(oAuth2Client);
                });
            });
            const server = app.listen(3000, () => {
                // open the browser to the authorize url to start the workflow
                opn(url, { wait: false });
            });
        }
        return url;
    }

    async listFiles(auth) {
        console.log('LISTING FILES');
        const drive = google.drive({ version: 'v3', auth });
        drive.files.list({
            pageSize: 10,
            fields: 'nextPageToken, files(id, name)'
        }, (err, res) => {
            if (err) return console.log('The API returned an error: ' + err);
            const files = res.data.files;
            if (files.length) {
                console.log('Files:');
                files.map((file) => {
                    console.log(`${file.name} (${file.id})`);
                });
            } else {
                console.log('No files found.');
            }
        });
    }

    async getPicture(auth) {
        console.log('getting picture');
        const people = google.people({ version: 'v1', auth });
        try {
            const res = await people.people.get({
                resourceName: 'people/me',
                personFields: 'emailAddresses,names,photos'
            });
            console.log(res.data);
        } catch (e) {
            console.log('Error!');
            console.log(e);
        }
    }

}

export default GoogleDriveService;
