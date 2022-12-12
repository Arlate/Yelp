// import * as dotenv from 'dotenv'
// dotenv.config()
mapboxgl.accessToken = 'pk.eyJ1IjoiYXJsYXQiLCJhIjoiY2xiaWhhdGN0MGxqbTN3bzB5ZTF4bjUxcSJ9.k1_zmfDZfp96T1i7cuiBgw';
const map = new mapboxgl.Map({
    container: 'map', // container ID
    style: 'mapbox://styles/mapbox/outdoors-v10', // style URL
    center: campsite.geometry.coordinates, // starting position [lng, lat]
    zoom: 9, // starting zoom
});
const marker = new mapboxgl.Marker()
    .setLngLat(campsite.geometry.coordinates)
    .setPopup(
        new mapboxgl.Popup({ offset: 25 })
            .setHTML(
                `<h4>${campsite.title}</h4><p>${campsite.location}</p>`
            )
    )
    .addTo(map)

map.addControl(new mapboxgl.NavigationControl())
