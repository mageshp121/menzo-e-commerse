var express = require('express');
const session = require('express-session');
const { Db, HostAddress } = require('mongodb');
const { restart } = require('nodemon');
const { response, render } = require('../app');
const { CART_COLLECTION } = require('../config/collection');
var router = express.Router();
var productHelperse = require('../helperse/productHelperse');
const userHelperse = require('../helperse/userHelperse');
const otpHelperse=require('../config/OTP')






let SingleProduct=async (req, res) => {



    
    let userA = req.session.user
    let singlePrId = req.params.id
    console.log(singlePrId,'jnjnwjdnjdejdne');
    if (userA){
      let id = req.session.user._id
      let cartCount = await userHelperse.getCartCount(id)
      let singleProduct = await productHelperse.getSingleProduct(singlePrId)
      console.log(singleProduct,'kkkllllllllllllllllllll');
      productHelperse.getAllCategory().then((ctdata) => {
        res.render('users/card-view', { user: true, ctdata, userA, singleProduct, cartCount })
      })
    } else{
      let singleProduct = await productHelperse.getSingleProduct(singlePrId)
      console.log(singleProduct,'................>>>>>>>>>>>>>>>>>>>>>>>>>>>>>');
      productHelperse.getAllCategory().then((ctdata) => {
        res.render('users/card-view', { user: true, ctdata, userA, singleProduct })
      })
    }
  }

