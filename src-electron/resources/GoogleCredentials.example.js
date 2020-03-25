export default {
    installed: {
        clientId: 'client_id',
        projectId: 'project_id',
        authUri: 'https://accounts.google.com/o/oauth2/auth',
        tokenUri: 'https://oauth2.googleapis.com/token',
        authProviderX509CertUrl: 'https://www.googleapis.com/oauth2/v1/certs',
        clientSecret: 'client_secret',
        redirectUris: [
            'urn:ietf:wg:oauth:2.0:oob',
            'http://localhost:3000/oauth2callback'
        ]
    }
};
