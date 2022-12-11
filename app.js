import * as dotenv from 'dotenv'
dotenv.config()

const dbUrl = process.env.dbUrl;

import express from "express";
import mongoose from "mongoose";
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import methodOverride from 'method-override';
import ejsmate from "ejs-mate";
import Joi from "joi";

import expressSession from 'express-session';
import flash from "express-flash";
import MongoStore from 'connect-mongo';


import passport from "passport";
import LocalStrategy from 'passport-local';
import { User } from "./models/user.js";

import mongoSanitize from "express-mongo-sanitize";
import helmet from 'helmet';


import { Campground } from './models/campgrounds.js';
import { Review } from "./models/review.js";
import { AppError } from "./utils/apperror.js";
import { catchAsync } from "./utils/catchAsync.js";




const app = express();
app.listen(8080, () => console.log('LISTENING ON 3000'))
app.set('views', path.join(__dirname, 'views'));
app.engine('ejs', ejsmate);
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

app.use(mongoSanitize({ replaceWith: '_' }));
// app.use(helmet.contentSecurityPolicy());
// app.use(helmet.crossOriginEmbedderPolicy());
// app.use(helmet.crossOriginOpenerPolicy());
// app.use(helmet.crossOriginResourcePolicy());
app.use(helmet.dnsPrefetchControl());
app.use(helmet.expectCt());
app.use(helmet.frameguard());
app.use(helmet.hidePoweredBy());
app.use(helmet.hsts());
app.use(helmet.ieNoOpen());
app.use(helmet.noSniff());
app.use(helmet.originAgentCluster());
app.use(helmet.permittedCrossDomainPolicies());
app.use(helmet.referrerPolicy());
app.use(helmet.xssFilter());

const scriptSrcUrls = [
    "https://stackpath.bootstrapcdn.com/",
    "https://api.tiles.mapbox.com/",
    "https://api.mapbox.com/",
    "https://kit.fontawesome.com/",
    "https://cdnjs.cloudflare.com/",
    "https://cdn.jsdelivr.net",
    'https://api.mapbox.com/mapbox-gl-js/v2.11.0/mapbox-gl.js',
];
const styleSrcUrls = [
    "https://kit-free.fontawesome.com/",
    "https://stackpath.bootstrapcdn.com/",
    "https://api.mapbox.com/",
    "https://api.tiles.mapbox.com/",
    "https://fonts.googleapis.com/",
    "https://use.fontawesome.com/",
    'https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/css/bootstrap.min.css',
    "https://api.mapbox.com/mapbox-gl-js/v2.11.0/mapbox-gl.css",
];
const connectSrcUrls = [
    "https://api.mapbox.com/",
    "https://a.tiles.mapbox.com/",
    "https://b.tiles.mapbox.com/",
    "https://events.mapbox.com/",
];
const fontSrcUrls = [];
app.use(
    helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: [],
            connectSrc: ["'self'", ...connectSrcUrls],
            scriptSrc: ["'unsafe-inline'", "'self'", ...scriptSrcUrls],
            styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
            workerSrc: ["'self'", "blob:"],
            objectSrc: [],
            imgSrc: [
                "'self'",
                "blob:",
                "data:",
                "https://res.cloudinary.com/dwszziymi/",
                "https://images.unsplash.com/",
            ],
            fontSrc: ["'self'", ...fontSrcUrls],
        },
    }),

);



const store = MongoStore.create({
    mongoUrl: dbUrl,
    secret: 'secret',
    touchAfter: 24 * 3600
});

store.on('error', function(e) {
    console.log('SESSION ERROR', e)
});


const sessionConfig = {
    store: store,
    name: 'sessionsss',
    secret: "smallsecret",
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        expires: Date.now() + 1000 * 60 * 60 * 24,
        maxAge: 1000 * 60 * 60 * 24,
        // secure: true
    }
}

app.use(expressSession(sessionConfig));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// mongoose.connect('mongodb://127.0.0.1:27017/yelp-camp', { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.set('strictQuery', false);
mongoose.connect(dbUrl, { useNewUrlParser: true, useUnifiedTopology: true });

const db = mongoose.connection;
db.on('error', console.error.bind(console), "connection error");
db.once("open", () => { console.log("CONNECTED WITH DB") });




app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
})

app.get('/', (req, res) => {
    res.render('home')
})

import { campgroundsRouter } from "./routes/campgrounds.js";
app.use("/campgrounds", campgroundsRouter)

import { reviewRouter } from "./routes/reviews.js";
app.use('/campgrounds/:id/reviews', reviewRouter);

import { usersRouter } from "./routes/users.js";
app.use('/', usersRouter);

app.all('*', (req, res, next) => {
    next(new AppError('Page not found', 404))
})

app.use((err, req, res, next) => {
    if (!err.message) err.message = "Something went wrong";
    if (!err.statusCode) err.statusCode = 500;
    res.status(err.statusCode).render('error', { err })
})
