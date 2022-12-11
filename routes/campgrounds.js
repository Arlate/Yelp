import { Router } from "express";
import { AppError } from "../utils/apperror.js";
import { catchAsync } from "../utils/catchAsync.js";
import { isLoggedIn, isAuthor } from "../utils/middleware.js";
import { Campground } from '../models/campgrounds.js';
import {Joi} from "../utils/htmlsafe.js";

import multer from "multer";
import { Cloudinary, storage } from "../cloudinary/index.js";
const upload = multer({ storage });

import * as dotenv from 'dotenv'
dotenv.config()

import mbxGeocoding from '@mapbox/mapbox-sdk/services/geocoding.js';
const mapBoxToken = process.env.MAP_TOKEN;
console.log(mapBoxToken);
const geocoder = mbxGeocoding({ accessToken: mapBoxToken });

const router = Router();

const validateCampground = (req, res, next) => {
    const campValSchema = Joi.object({
        campground: Joi.object({
            title: Joi.string().required().escapeHTML(),
            price: Joi.number().required().min(0),
            // image: Joi.string().required(),
            location: Joi.string().required().escapeHTML(),
            description: Joi.string().required().escapeHTML(),
        }).required(),
        deleteImages: Joi.array(),
    });
    const { error } = campValSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(',');
        throw new AppError(msg, 400);
    } else {
        next();
    }
}

router.get('/', async (req, res) => {
    const camps = await Campground.find({});
    res.render('campgrounds/index', { camps })
})

router.get('/new', isLoggedIn, (req, res) => {
    res.render('campgrounds/new')
})

router.post('/', isLoggedIn, upload.array('image'), validateCampground, catchAsync(async (req, res, next) => {
    // if(!req.body.campground) throw new AppError("Invalid Campground Data", 400);
    const geoData = await geocoder.forwardGeocode({
        query: req.body.campground.location,
        limit: 1
    }).send()
    const camp = new Campground(req.body.campground);
    camp.geometry = geoData.body.features[0].geometry;
    camp.author = req.user._id;
    camp.images = req.files.map(f => ({ url: f.path, filename: f.filename }));
    await camp.save();
    req.flash('success', "Successfully added a new campground!");
    res.redirect(`/campgrounds/${camp._id}`);
}))

router.get('/:id', catchAsync(async (req, res) => {
    const { id } = req.params;
    const camp = await Campground.findById(id).populate({ path: 'reviews', populate: { path: 'author' } }).populate('author');
    if (!camp) {
        req.flash('error', 'Cannot find that campground');
        return res.redirect('/campgrounds');
    }
    res.render('campgrounds/single', { camp })
}))

router.get('/:id/edit', isLoggedIn, isAuthor, catchAsync(async (req, res) => {
    const { id } = req.params;
    const camp = await Campground.findById(id);
    if (!camp) {
        req.flash('error', 'Cannot find that campground');
        return res.redirect('/campgrounds');
    }
    res.render('campgrounds/edit', { camp })
}))

router.patch('/:id', isLoggedIn, isAuthor, upload.array('image'), validateCampground, catchAsync(async (req, res) => {
    const { id } = req.params;
    let camp = await Campground.findByIdAndUpdate(id, { ...req.body.campground });
    const imgs = req.files.map(f => ({ url: f.path, filename: f.filename }));
    camp.images.push(...imgs);
    await camp.save();
    if (req.body.deleteImages) {
        for (let filename of req.body.deleteImages) {
            await Cloudinary.uploader.destroy(filename);
        }
        await camp.updateOne({ $pull: { images: { filename: { $in: req.body.deleteImages } } } });
    }
    req.flash('success', "Successfully updated the campground!");
    res.redirect(`/campgrounds/${id}`)
}))

router.delete('/:id', isLoggedIn, isAuthor, catchAsync(async (req, res) => {
    const { id } = req.params;
    await Campground.findByIdAndDelete(id);
    req.flash('success', "Successfully deleted the campground!");
    res.redirect('/campgrounds')
}))

export const campgroundsRouter = router;
