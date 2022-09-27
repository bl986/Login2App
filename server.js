//load in environ var
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}

// set up basic express app
const express = require('express')
const app = express()
const bcrypt = require('bcrypt')
const passport = require('passport')
const flash = require('express-flash')
const session = require('express-session')
const methodOverride = require('method-override')

const initializePassport = require('./passport-config')
initializePassport(
    passport, 
    email => { return users.find(user => user.email === email) },
    id => users.find(user => user.id == id)
)


const users = [] //note that everytime it restarts, user info will be cleared to this empty array, because we don't have a database


app.set('view-engine', 'ejs')
app.use(express.urlencoded({ extended: false}))
app.use(flash())
app.use(session({
    secret: process.env.SESSION_SECRET, //give it a environment variable
    resave: false,                      //no resave if nothing changed
    saveUninitialized: false            //no save empty value
}))
app.use(passport.initialize())
app.use(passport.session())             //forgot () after session, caused error
app.use(methodOverride('_method'))






//set up route
app.get('/', checkAuthenticated, (req, res) => { //recall that this is same as function (req, res) {}
    res.render('index.ejs', { name: req.user.name })
})

app.get('/login', checkNotAuthenticated, (req, res) => {
    res.render('login.ejs')
})









// app.post('/login', (req, res) => { })
app.post('/login', checkNotAuthenticated, passport.authenticate('local', {
    successRedirect: '/',       //if success, redirect/go to home page i.e. '/'
    failureRedirect: '/login',  //go back to login if fail
    failureFlash: true          //show the flash message if fail, either wrong email/password or user no exist
}))












app.get('/register', checkNotAuthenticated, (req, res) => {
    res.render('register.ejs')
})

app.post('/register', checkNotAuthenticated, async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10)
        users.push({
            id: Date.now().toString(),
            name: req.body.name,
            email: req.body.email,
            password: hashedPassword
        })
        res.redirect('/login')
    } catch {
        res.redirect('/register')
    }
    console.log(users)
})

app.delete('/logout', (req, res,) => {
    req.logOut()
    res.redirect('/login')
})





//need this function otherwise could get error for non-authenticated user after resave the code
//and the users query will be empty so that all saved authenticated user got reset to null query
function checkAuthenticated(req, res, next) {
    //if authenticated go to the next
    if (req.isAuthenticated()) {
        return next()
    }

    res.redirect('/login')
}

function checkNotAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return res.redirect('/')
    }

    next()
}





app.listen(3000) //give it a port