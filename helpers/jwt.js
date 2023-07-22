const expressJwt = require('express-jwt')

function authJwt(){
    return expressJwt({
        secret: process.env.JWT_SECRET,
        algorithms: ['HS256'],
        isRevoked: isRevoked
    }).unless({
        path: [
            {url:/\/public\/uploads(.*)/ , methods: ['GET' , 'OPTIONS']},
            {url:/\/api\/v1\/products(.*)/ , methods: ['GET' , 'OPTIONS']},
            {url:/\/api\/v1\/categories(.*)/ , methods: ['GET' , 'OPTIONS']},
            '/api/v1/users/login',
            '/api/v1/users/register',
            '/',
            '/health'
        ]
    })
}

async function isRevoked(req,payload,done){

    if(!payload.isAdmin){
        done(null , true)
    }
    done()
}

module.exports = authJwt