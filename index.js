require("dotenv").config();


const express = require("express");
const app = express();
const cheerio = require("cheerio");
const axios = require("axios");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
console.log(accountSid, authToken)
const { Expo } = require("expo-server-sdk");

const client = require("twilio")(accountSid, authToken);
const port = 3000;
//const url = "https://github.com/SimplifyJobs/Summer2024-Internships";
const url = "https://github.com/ibrahimeatspie/cashcowtest/tree/main"

const listingSchema = new Schema({
  companyName: String,
  roleName: String,
  location: String,
  applicationLink: String,
  datePosted: String,
});
const Listing = mongoose.model("Listing", listingSchema);

console.log(process.env.DATABASE_URI); // remove this after you've confirmed it is working

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.DATABASE_URI, {
      useUnifiedTopology: true,
      useNewUrlParser: true,
    });
  } catch (err) {
    console.error(err);
  }
};

connectDB();

const fetchData = async () => {
  try {
    let res = await axios.get(url);
    let $ = await cheerio.load(res.data);
    // console.log($)

    $("#readme > div.Box-body.px-5.pb-5 > article > table > tbody > tr").each(
      async (i, elem) => {
        // companyName:String,
        // roleName: String,
        // location:String,
        // applicationLink:String,
        // datePosted:String

        const name = $(elem).find("td").eq(0).text();
        const position = $(elem).find("td").eq(1).text();
        const location = $(elem).find("td").eq(2).text();
        const link = $(elem).find("td").eq(3).find("a").attr("href");
        const date = $(elem).find("td").eq(4).text();

        // console.log(name);
        // console.log(position);
        // console.log(location);
        // console.log(link);
        // console.log(date);

        const existingListing = await Listing.findOne({
          companyName: name,
          roleName: position,
          location: location,
          applicationLink: link,
          datePosted: date,
        });
        if (!existingListing) {
          await Listing.create({
            companyName: name,
            roleName: position,
            location: location,
            applicationLink: link,
            datePosted: date,
          });
          console.log("Inserted");

          client.messages
          .create({
            // body: "Company "+name+" has posted an opening for "+position +" with application link "+link,

            body: "GYAAAAT",
            from: "+18777618238",
            to: "+16309012974",
          })
          .then((message) => console.log(message.sid));
      


          
        } 
      }
    );
  } catch (e) {
    console.log(e);
  }
};

mongoose.connection.once("open", () => {
  console.log("Connected to DB ");
  app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
  });
  fetchData();

//   client.messages
//     .create({
//       body: "This is the ship that made the Kessel Run in fourteen parsecs?",
//       from: "+18777618238",
//       to: "+16309012974",
//     })
//     .then((message) => console.log(message.sid));
});
app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.get("/noti",(req,res)=>{

  
    let expo = new Expo();
    let somePushTokens = ["ExponentPushToken[s8M87MGOogRo0fU4Zm-K6Q]"]
    let messages = [];
    for (let pushToken of somePushTokens) {
      // Each push token looks like ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]
    
      // Check that all your push tokens appear to be valid Expo push tokens
      if (!Expo.isExpoPushToken(pushToken)) {
        console.error(`Push token ${pushToken} is not a valid Expo push token`);
        continue;
      }
    
      // Construct a message (see https://docs.expo.io/push-notifications/sending-notifications/)
      messages.push({
        to: pushToken,
        sound: 'default',
        body: 'This is a test notification',
        data: { withSome: 'data' },
      })
    }
    
    // The Expo push notification service accepts batches of notifications so
    // that you don't need to send 1000 requests to send 1000 notifications. We
    // recommend you batch your notifications to reduce the number of requests
    // and to compress them (notifications with similar content will get
    // compressed).
    let chunks = expo.chunkPushNotifications(messages);
    let tickets = [];
    (async () => {
      // Send the chunks to the Expo push notification service. There are
      // different strategies you could use. A simple one is to send one chunk at a
      // time, which nicely spreads the load out over time:
      for (let chunk of chunks) {
        try {
          let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
          console.log(ticketChunk);
          tickets.push(...ticketChunk);
          // NOTE: If a ticket contains an error code in ticket.details.error, you
          // must handle it appropriately. The error codes are listed in the Expo
          // documentation:
          // https://docs.expo.io/push-notifications/sending-notifications/#individual-errors
        } catch (error) {
          console.error(error);
        }
      }
    })();
    
    
    
    // Later, after the Expo push notification service has delivered the
    // notifications to Apple or Google (usually quickly, but allow the the service
    // up to 30 minutes when under load), a "receipt" for each notification is
    // created. The receipts will be available for at least a day; stale receipts
    // are deleted.
    //
    // The ID of each receipt is sent back in the response "ticket" for each
    // notification. In summary, sending a notification produces a ticket, which
    // contains a receipt ID you later use to get the receipt.
    //
    // The receipts may contain error codes to which you must respond. In
    // particular, Apple or Google may block apps that continue to send
    // notifications to devices that have blocked notifications or have uninstalled
    // your app. Expo does not control this policy and sends back the feedback from
    // Apple and Google so you can handle it appropriately.
    let receiptIds = [];
    for (let ticket of tickets) {
      // NOTE: Not all tickets have IDs; for example, tickets for notifications
      // that could not be enqueued will have error information and no receipt ID.
      if (ticket.id) {
        receiptIds.push(ticket.id);
      }
    }
    
    let receiptIdChunks = expo.chunkPushNotificationReceiptIds(receiptIds);
    (async () => {
      // Like sending notifications, there are different strategies you could use
      // to retrieve batches of receipts from the Expo service.
      for (let chunk of receiptIdChunks) {
        try {
          let receipts = await expo.getPushNotificationReceiptsAsync(chunk);
          console.log(receipts);
    
          // The receipts specify whether Apple or Google successfully received the
          // notification and information about an error, if one occurred.
          for (let receiptId in receipts) {
            let { status, message, details } = receipts[receiptId];
            if (status === 'ok') {
              continue;
            } else if (status === 'error') {
              console.error(
                `There was an error sending a notification: ${message}`
              );
              if (details && details.error) {
                // The error codes are listed in the Expo documentation:
                // https://docs.expo.io/push-notifications/sending-notifications/#individual-errors
                // You must handle the errors appropriately.
                console.error(`The error code is ${details.error}`);
              }
            }
          }
        } catch (error) {
          console.error(error);
        }
      }
    })();
    res.send("sent!");


})