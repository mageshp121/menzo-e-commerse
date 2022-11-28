const { resolve } = require("promise");
require('dotenv').config()


///////////////////////////////////////////////////////
//var SID = 'AC6a14faf4f640c8d04344d7b5b983df81';
var SID=process.env.Twilio_sid
//var TOKEN = '6d6b869f918a2304f9db2cf22e2f3a71';
var TOKEN=process.env.Twilio_Token
const client = require("twilio")(SID, TOKEN);
//var serviceID="VA4dcb74e318a645620ffb633629facdc3"
var serviceID=process.env.Twilio_serviceid
///////////////////////////////////////////////////////
var mobileNumber
module.exports = {

    sendOTP: (phoneNumber) => {
        console.log(phoneNumber,'////////////dhahdahhasaagahhsahsahsaj');
        mobileNumber=phoneNumber
        return new Promise(async(resolve,reject)=>{
            client.verify
            .services(serviceID) // Change service ID
            .verifications.create({
                to: `+${mobileNumber}`,
                channel:  "sms",
            })
            .then((data) => {
               resolve(data)
            });
        })
    },
    verifyOTP:(OTP)=>{
        return new Promise(async(resolve,reject)=>{
            client.verify
            .services(serviceID) 
            .verificationChecks.create({
              to: `+${mobileNumber}`,
              code: OTP,
            })
            .then((data) => {
              if (data.status === "approved") {
                resolve({status:true})
              } else {
                resolve({status:false})
              }
            });
        
        })
    }

}