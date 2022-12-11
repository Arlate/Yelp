import { Campground } from "../models/campgrounds.js";
import { Review } from "../models/review.js";

export const isLoggedIn = (req,res,next) => {
    if (!req.isAuthenticated()) {
        req.session.returnTo = req.originalUrl;
        req.flash('error', 'You need to be logged in!');
        return res.redirect('/login');
    }
    next();
}

export const isAuthor = async(req,res,next) =>{
    const { id } = req.params;
    const camp = await Campground.findById(id);
    if (!camp.author.equals(req.user._id)) {
        req.flash('error', "You don't have permission to do that");
        return res.redirect(`/campgrounds/${id}`);
    }
    next();
}

export const isReviewAuthor = async(req,res,next) =>{
    const { id, reviewID } = req.params;
    const review = await Review.findById(reviewID);
    if (!review.author.equals(req.user._id)) {
        req.flash('error', "You don't have permission to do that");
        return res.redirect(`/campgrounds/${id}`);
    }
    next();
}