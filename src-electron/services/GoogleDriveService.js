import fs from 'fs';
import { google } from 'googleapis';
import GoogleCredentials from '../resources/GoogleCredentials';
import opn from 'open';
import express from 'express';
import FileSystemUtils from '../utils/FileSystemUtils';
import NotificationService from './NotificationService';
import { StockHistoryFiles } from './StockHistoryService';

const SCOPES = [
    'https://www.googleapis.com/auth/drive.appdata',
    'https://www.googleapis.com/auth/userinfo.profile'
];
const TOKEN_FILE = 'token.json';
const notificationService = new NotificationService();

class GoogleDriveService {

    async getOAuth2ClientFromDisk() {
        const path = `${await FileSystemUtils.getDataPath()}/${TOKEN_FILE}`;
        const { clientSecret, clientId, redirectUris } = GoogleCredentials.installed;
        const oAuth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUris[1]);
        const tokenStr = (await fs.promises.readFile(path, { flag: 'a+', encoding: 'utf-8' })).toString();
        if (tokenStr.length > 0) {
            oAuth2Client.credentials = JSON.parse(tokenStr);
            return oAuth2Client;
        }
        return null;
    }

    async autoLogin() {
        const oAuth2Client = await this.getOAuth2ClientFromDisk();
        if (oAuth2Client === null) return null;
        const picture = await this.getPicture(oAuth2Client);
        notificationService.notifyLoginSuccess(picture);
        await this.downloadFiles();
    }

    async login() {
        let oAuth2Client = await this.getOAuth2ClientFromDisk();
        if (oAuth2Client !== null) {
            const picture = await this.getPicture(oAuth2Client);
            notificationService.notifyLoginSuccess(picture);
        } else {
            const path = `${await FileSystemUtils.getDataPath()}/${TOKEN_FILE}`;
            const { clientSecret, clientId, redirectUris } = GoogleCredentials.installed;
            oAuth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUris[1]);
            const url = oAuth2Client.generateAuthUrl({
                access_type: 'offline',
                scope: SCOPES
            });

            const app = express();
            app.get('/oauth2callback', async (req, res) => {
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

                    const picture = await this.getPicture(oAuth2Client);
                    notificationService.notifyLoginSuccess(picture);
                });
            });
            const server = app.listen(3000, () => {
                // open the browser to the authorize url to start the workflow
                opn(url, { wait: false });
            });
        }
    }

    async logout() {
        const path = `${await FileSystemUtils.getDataPath()}/${TOKEN_FILE}`;
        await fs.promises.unlink(path);
    }

    async getPicture(auth) {
        const people = google.people({ version: 'v1', auth });
        try {
            const res = await people.people.get({
                resourceName: 'people/me',
                personFields: 'emailAddresses,names,photos'
            });
            return {
                name: res.data.names[0].displayName,
                photo: res.data.photos[0].url
            };
        } catch (e) {
            console.log('Error!');
            console.log(e);
        }
        return null;
    }

    async uploadFiles() {
        console.log('Uploading files...');
        const oAuth2Client = await this.getOAuth2ClientFromDisk();
        if (oAuth2Client === null) return;

        const drive = google.drive({
            version: 'v3',
            auth: oAuth2Client
        });

        const rootPath = await FileSystemUtils.getDataPath();

        for (const file of Object.values(StockHistoryFiles)) {
            console.log(`Uploading ${file}...`);

            try {
                const fileMetadata = {
                    'name': file,
                    'parents': ['appDataFolder']
                };
                const media = {
                    mimeType: 'application/json',
                    body: fs.createReadStream(`${rootPath}/${file}`)
                };

                drive.files.create({
                    resource: fileMetadata,
                    media: media,
                    fields: 'id'
                }, (err, file) => {
                    if (err) {
                        // Handle error
                        console.error(err);
                    }
                });
            } catch (e) {
                console.log(e.message);
                console.log(e);
            }
        }
    }

    async downloadFiles() {
        console.log('Download files...');
        const oAuth2Client = await this.getOAuth2ClientFromDisk();
        if (oAuth2Client === null) return;

        const drive = google.drive({
            version: 'v3',
            auth: oAuth2Client
        });

        try {
            drive.files.list({
                spaces: 'appDataFolder',
                fields: 'nextPageToken, files(id, name)',
                pageSize: 100
            }, (err, res) => {
                if (err) {
                    // Handle error
                    console.error(err);
                } else {
                    res.data.files.forEach((file) => {
                        console.log('Found file:', file.name, file.id);
                    });
                }
            });
        } catch (e) {
            console.log(e.message);
            console.log(e);
        }
    }

}

export default GoogleDriveService;
