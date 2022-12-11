import { Router } from "express";
import { AppError } from "../utils/apperror.js";
import { catchAsync } from "../utils/catchAsync.js";
import { Review } from "../models/review.js";
import { Campground } from '../models/campgrounds.js';
import {Joi} from "../utils/htmlsafe.js";
import { isLoggedIn, isReviewAuthor } from "../utils/middleware.js";

const router = Router({mergeParams: true});

const validateReview = (req,res,next) => {
    const reviewValSchema = Joi.object({
        review: Joi.object({
            rating: Joi.number().required().min(1).max(5),
            body: Joi.string().required().escapeHTML()
        }).required()
    });
    const {error} = reviewValSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(',');
        throw new AppError(msg, 400);
    } else{
        next();
    }
}

router.post('/', validateReview, isLoggedIn, catchAsync(async(req,res) => {
    const {id} = req.params
    const camp = await Campground.findById(id);
    const review = new Review(req.body.review);
    review.author = req.user._id;
    camp.reviews.push(review);
    await review.save();
    await camp.save();
    req.flash('success', "Successfully added a new review");
    res.redirect(`/campgrounds/${id}`)
}))

router.delete('/:reviewID', isLoggedIn, isReviewAuthor, catchAsync(async (req,res) => {
    const {id, reviewID} = req.params;
    await Campground.findByIdAndUpdate(id, {$pull: {reviews: reviewID}});
    await Review.findByIdAndDelete(reviewID);
    req.flash('success', "Successfully deleted the review");
    res.redirect(`/campgrounds/${id}`);
}))

export const reviewRouter = router;