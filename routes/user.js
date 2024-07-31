const express = require('express')
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const user = require('../models/user');
const validateUser = require('../middlewares/validateUser');
const verifyToken = require('../middlewares/verifyToken');

const router = express.Router();

router.post('/login', async(req, res) => {
    try {
        const {email, password} = req.body;
        const existingUser = await user.findOne({email: email})

        if(existingUser) {
            const passwordmatch = await bcrypt.compare(password, existingUser.password)
            if(passwordmatch) {
                const token = jwt.sign({id: existingUser._id, email: existingUser.email}, 'secretkey', {expiresIn: '2d'})
                return res.status(200).json({
                    status: 'Success',
                    message: 'User logged in successfully',
                    token: token,
                    user: existingUser
                })
            }
            else {
                return res.status(501).json({
                    status: 'Failed',
                    message: 'Incorrect credentials'
                })
            }
        } else {
            return res.status(501).json({
                status: 'Failed',
                message: 'User does not exist, please sign up'
            })
        }
    } catch (error) {
        res.status(501).json({
            message: 'Something went wrong',
            err: error
        })
    }
})

router.post('/register',validateUser, async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const existingUser = await user.findOne({ email: email })
        if (existingUser) {
            return res.status(501).json({
                status: 'Failed',
                message: 'User already exists!'
            })
        }
        else {
            const hashedPassword = await bcrypt.hash(password, 5);
            const newUser = new user({
                username,
                email,
                password: hashedPassword,
            })

            await newUser.save();   // handle the case where users with same email-id should not be able register again
            return res.status(201).json({
                status: 'Success',
                message: 'User registered successfully',
                user: newUser
            })
        }
    } catch (error) {
        res.status(501).json({
            message: 'Something went wrong',
            err: error
        })
    }
})


router.patch('/update/:userId', verifyToken, async (req, res) => {
    try {
        const {name, email, password}  = req.body;
        const {userId} = req.params;

        const updateFields = {};
        if (name) updateFields.username = name;
        if (email) updateFields.email = email;
        if (password) updateFields.password = await bcrypt.hash(password, 5);
        await user.findByIdAndUpdate(userId, updateFields)

        res.json({
            status: 'Success',
            message: 'Details updated successfully!'
        });
    } catch (error) {
        res.status(501).json({
            status: 'Failed',
            message: 'Something went wrong',
            err: error
        });
    }
})

router.post('/login/status', verifyToken, async (req, res) => {
    try {
        const {email} = req.body
        console.log(email)
        const existingUser = await user.findOne({email})
        console.log(existingUser)
        if(existingUser) {
            res.status(200).json({
                status: 'Success',
                message: 'User logged in previously',
                user: existingUser
               }) 
        }
         else {
            res.status(200).json({
                status: 'Success',
                message: 'User not found',
               }) 
         }
    } catch (error) {
        res.status(500).json({
            status: 'Failed',
            message: 'User not logged in, Please login!',
            error: 'There is an error: ' + error
           })
    }
});

router.get('/get-users', async (req, res) => {
    try {
        const existingUsers = await user.find()
        if (existingUsers) {
            return res.status(200).json({
                status: 'Success',
                userDetails: existingUsers
            })
        } else {
            return res.status(501).json({
                status: 'Failed',
                message: 'User Does not exist, please register!'
            })
        }
    } catch (error) {
        res.status(501).json({
            message: 'Something went wrong',
            err: error
        });
    }
})

router.delete('/delete-user/:userId', async (req, res) => {
    try {
        const {userId} = req.params;
        await user.findByIdAndDelete(userId);
        res.status(200).json({
            status: 'Success',
            message: 'User data is deleted.'
        })
    } catch (error) {
        res.status(501).json({
            message: 'Something went wrong',
            err: error
        });
    }
})

module.exports = router