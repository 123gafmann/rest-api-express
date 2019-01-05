const express = require('express');
const chalk = require('chalk');
const Joi = require('joi');
const jwt = require('jsonwebtoken');

const mockObjects = require('./staticObjects');
const port = process.env.PORT || 5000;

const app = express();

app.use(express.json());

app.get('/', (req, res) => {
    res.json({
        api: '/users'
    })
});

app.get('/users', (req, res) => {
    res.send(mockObjects.users);
});

app.get('/users/:id', (req, res) => {
    const user = mockObjects.users.find(u => u.id === parseInt(req.params.id));
    if (!user) {
        res.status(404).send('The user with given Id does not exist!');
        return;
    }
    res.send(user);
});

app.post('/users', verifyAuthentication, (req, res) => {
    jwt.verify(req.token, 'AWQDJJUHPNKNUIBDQOASD', (err, authData) => {
        if (err) {
            res.status(403).send('authorization could not be verified!')
        } else {
            const { error } = validateUserSchema(req.body);
            if (error) {
                res.status(400).send(error.details[0].message)
                return;
            }

            console.log(authData);

            const user = {
                id: mockObjects.users.length + 1,
                name: req.body.name
            };

            mockObjects.users.push(user);
            res.send(user);
        }
    });
});

app.post('/login', (req, res) => {
    const { error, value } = validateLoginUser(req.body);
    if (error) {
        res.status(400).send(error.details[0].message)
        return;
    }

    jwt.sign(value, 'AWQDJJUHPNKNUIBDQOASD', { expiresIn: '30s' }, (err, token) => {
        res.json({token});
    })
});

app.listen(port, () => {
    console.log(chalk.green(`server listening at port ${port}`));
});

function validateUserSchema(user) {
    const schema = {
        name: Joi.string().min(3).required()
    }

    const result = Joi.validate(user, schema);
    return result;
}

function validateLoginUser(loginUser) {
    const schema = {
        email: Joi.string().required(),
        password: Joi.string().required()
    }

    return Joi.validate(loginUser, schema);
}

function verifyAuthentication(req, res, next) {
    const authHeader = req.headers['authorization'];
    if (authHeader === undefined) {
        res.status(403).send('No authorization found!');
    } else {
        authHeaderSplit = authHeader.split(' ');
        if (authHeaderSplit.length < 2) {
            res.status(403).send('No Bearer info found!');
            return;
        }
        const token = authHeaderSplit[1];
        req.token = token;
        next();
    }
}
