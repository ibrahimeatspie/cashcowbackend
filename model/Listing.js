const mongoose = require('mongoose')
const Schema = mongoose.Schema;

const listingSchema = new Schema({
    companyName:String,
    roleName: String,
    location:String,
    applicationLink:String,
    datePosted:String

})

module.exports = mongoose.model('Listing', listingSchema)