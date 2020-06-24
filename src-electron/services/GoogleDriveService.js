import fs from 'fs';
import { google } from 'googleapis';
import GoogleCredentials from '../resources/GoogleCredentials';
import opn from 'open';
import express from 'express';
import FileSystemUtils from '../utils/FileSystemUtils';
import NotificationService from './NotificationService';
import FileService from './FileService';
import SyncGoogleDriveJob from '../jobs/SyncGoogleDriveJob';

const SCOPES = [
    'https://www.googleapis.com/auth/drive.appdata',
    'https://www.googleapis.com/auth/userinfo.profile'
];
const TOKEN_FILE = 'token.json';

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

    async isLogged() {
        return (await this.getOAuth2ClientFromDisk()) !== null;
    }

    async autoLogin() {
        const oAuth2Client = await this.getOAuth2ClientFromDisk();
        if (oAuth2Client === null) return null;
        const picture = await this.getPicture(oAuth2Client);
        NotificationService.notifyLoginSuccess(picture);
        await this.downloadFiles();
        SyncGoogleDriveJob.startJob();
    }

    async login(event) {
        let oAuth2Client = await this.getOAuth2ClientFromDisk();
        if (oAuth2Client !== null) {
            const picture = await this.getPicture(oAuth2Client);
            NotificationService.notifyLoginSuccess(picture);
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
                    res.type('html');
                    res.send('<h2>Login relizado com sucesso! Feche esta página e retorne ao app! 🐽 </h2>');
                    server.close();

                    const picture = await this.getPicture(oAuth2Client);
                    NotificationService.notifyLoginSuccess(picture);

                    const files = await this.listFiles();
                    if (files.length > 0)
                        event.reply('google-drive/ask-download');

                    await SyncGoogleDriveJob.startJob();
                });
            });
            const server = app.listen(3000, () => {
                // open the browser to the authorize url to start the workflow
                opn(url, { wait: false });
            });
        }
    }

    async logout(clearData) {
        if (clearData) {
            console.log('Deleting files on cloud...');
            await this.deleteFiles();
        }

        const path = `${await FileSystemUtils.getDataPath()}/${TOKEN_FILE}`;
        await fs.promises.unlink(path);
        await SyncGoogleDriveJob.stopJob();
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
        const existingFiles = await this.listFiles();
        const oAuth2Client = await this.getOAuth2ClientFromDisk();
        if (oAuth2Client === null) throw new Error('Not logged in Google Drive');

        const drive = google.drive({
            version: 'v3',
            auth: oAuth2Client
        });

        const rootPath = await FileSystemUtils.getDataPath();

        const files = FileService.getFileNames();

        for (const file of files) {
            try {
                const fullPath = `${rootPath}/${file}`;
                if (!fs.existsSync(fullPath)) continue;

                const fileMetadata = {
                    'name': file,
                    'parents': ['appDataFolder']
                };
                const media = {
                    mimeType: 'application/json',
                    body: fs.createReadStream(fullPath)
                };

                const callback = (err, file) => {
                    if (err) {
                        console.log(err);
                    }
                };

                const existingFile = existingFiles.filter(o => o.name === file)[0] || null;
                if (existingFile !== null) {
                    drive.files.update({
                        fileId: existingFile.id,
                        media: media,
                        fields: 'id'
                    }, callback);
                } else {
                    drive.files.create({
                        resource: fileMetadata,
                        media: media,
                        fields: 'id'
                    }, callback);
                }
            } catch (e) {
                console.log(e);
            }
        }
    }

    async listFiles() {
        const oAuth2Client = await this.getOAuth2ClientFromDisk();
        if (oAuth2Client === null) return;

        const drive = google.drive({
            version: 'v3',
            auth: oAuth2Client
        });

        return new Promise((resolve, reject) => {
            try {
                drive.files.list({
                    spaces: 'appDataFolder',
                    fields: 'nextPageToken, files(id, name)',
                    pageSize: 100
                }, (err, res) => {
                    if (err) {
                        console.error(err);
                        reject(err);
                    } else {
                        resolve(res.data.files);
                    }
                });
            } catch (e) {
                console.log(e);
                reject(e);
            }
        });
    }

    async downloadFiles() {
        const oAuth2Client = await this.getOAuth2ClientFromDisk();
        if (oAuth2Client === null) return;

        const drive = google.drive({
            version: 'v3',
            auth: oAuth2Client
        });

        const files = await this.listFiles();

        for (const file of files) {
            await this.downloadFile(drive, file);
        }
    }

    async downloadFile(drive, file) {
        const rootPath = await FileSystemUtils.getDataPath();
        const dest = fs.createWriteStream(`${rootPath}/${file.name}`);

        try {
            drive.files.get({ fileId: file.id, alt: 'media' },
                { responseType: 'stream' },
                (err, res) => {
                    if (err) {
                        console.log(err);
                        return;
                    }
                    res.data
                        .on('end', () => {
                            console.log(`Done ${file.name}`);
                        })
                        .on('error', err => {
                            console.log('Error', err);
                        })
                        .pipe(dest);
                });
        } catch (e) {
            console.log(e);
        }
    }

    async deleteFiles() {
        const files = await this.listFiles();
        const oAuth2Client = await this.getOAuth2ClientFromDisk();
        if (oAuth2Client === null) return;

        const drive = google.drive({
            version: 'v3',
            auth: oAuth2Client
        });
        for (const file of files) {
            console.log(`Deleting ${file.name}`);
            drive.files.delete({ fileId: file.id }, {}, (err, res) => {
                if (err) {
                    console.log(err);
                    return;
                }
                console.log('Delete successfully!');
            });
        }
    }

}

export default GoogleDriveService;
