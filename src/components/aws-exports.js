export default {

    Auth: {
        Cognito: {
            userPoolClientId: '4b4ha50rucprv5vvq7m9f2a1fc',
            userPoolId: 'us-east-1_7Wrwi2VGT',
            loginWith: { // Optional
                oauth: {
                    domain: 'https://pwr266886.auth.us-east-1.amazoncognito.com',
                    scopes: ['openid email phone profile aws.cognito.signin.user.admin '],
                    redirectSignIn: ['http://localhost:5173/', 'https://example.com/'],
                    redirectSignOut: ['http://localhost:5173/', 'https://example.com/'],
                    responseType: 'code',
                },
                username: 'true',
                email: 'false', // Optional
                phone: 'false', // Optional
            }
        }
    }


}
