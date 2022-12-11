import express from "express";
import mongoose from "mongoose";
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


import { Campground } from '.././models/campgrounds.js'
import { descriptors, places } from './seedDesc.js'
import { cities } from './cities.js'


mongoose.connect('mongodb://127.0.0.1:27017/yelp-camp', { useNewUrlParser: true, useUnifiedTopology: true })

const db = mongoose.connection;
db.on('error', console.error.bind(console), "connection error");
db.once("open", () => { console.log("CONNECTED WITH DB") })

const pick = array => array[Math.floor(Math.random() * array.length)];

const seedDB = async () => {
    await Campground.deleteMany({});
    for (let i = 0; i < 250; i++) {
        const random1000 = Math.floor(Math.random() * 1000);
        const price = Math.floor(Math.random() * 40) + 10
        const camp = new Campground({
            title: `${pick(descriptors)} ${pick(places)}`,
            author: '6394828a0586096704b545b0',
            location: `${cities[random1000].city}, ${cities[random1000].state}`,
            description: "Lorem ipsum dolor sit amet consectetur adipisicing elit.\
            Officia placeat vel iusto cumque qui! Molestias eos est fugiat, ratione, aperiam quas illo nisi unde ad beatae natus, \
            in similique nihil Corrupti voluptas alias dignissimos porro accusantium impedit.Repellendus ipsum neque minus repellat nisi, \
            atque voluptatibus distinctio!",
            price: price,
            images: [
              {
                url: 'https://res.cloudinary.com/dwszziymi/image/upload/v1670702916/YelpCamp/uhzaruxi8i3t1wh7el03.jpg',
                filename: 'YelpCamp/uhzaruxi8i3t1wh7el03',
              },
                {
                    url: 'https://res.cloudinary.com/dwszziymi/image/upload/v1670702908/YelpCamp/yufv7umrbr5pqggv6fmk.jpg',
                    filename: 'YelpCamp/yufv7umrbr5pqggv6fmk',
                  },
                {
                    url: 'https://res.cloudinary.com/dwszziymi/image/upload/v1670702910/YelpCamp/oudzc8jtegcmt8wkumh6.jpg',
                    filename: 'YelpCamp/oudzc8jtegcmt8wkumh6',
                  },
              
                ],
            geometry: { type: 'Point', coordinates: [ cities[random1000].longitude, cities[random1000].latitude] }
        })
        await camp.save()
    }
}

seedDB()
    .then(() => mongoose.connection.close());