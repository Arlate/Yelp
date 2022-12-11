import mongoose from "mongoose";
import { Review } from "./review.js";
const Schema = mongoose.Schema;

const ImageSchema = new Schema({
    url: String,
    filename: String
})

ImageSchema.virtual('thumbnail').get(function() {
    return this.url.replace('/upload','/upload/w_300');
})

const opts = {toJSON: {virtuals: true}};

const CampgroundSchema = new Schema({
    title: String,
    price: Number,
    description: String,
    location: String,
    images: [ImageSchema],
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    reviews: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Review'
        }
    ],
    geometry: {
        type: {
            type: String,
            enum:['Point'],
            // required: true
        },
        coordinates: {
            type: [Number],
            // required: true
        }
    }
}, opts);

CampgroundSchema.virtual('properties.popUpMarkup').get(function () {
    return `<strong><a href="/campgrounds/${this._id}">${this.title}</a><strong>`
})

CampgroundSchema.post('findOneAndDelete', async(camp) => {
    if(camp) {
        await Review.deleteMany( { _id: {$in: camp.reviews}})
    }
})

export const Campground =  mongoose.model('Campground', CampgroundSchema);