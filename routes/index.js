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


// custom middleware to check if user is loggede in
const verifyLogin = (req, res, next) => {
  if (req.session.user) {
    next()
  } else {
    res.redirect('/userlogin')
  }
}


/* GET home page. */
router.get("/", async function (req, res, next) {
  //cartCount = null
  if (req.session.user) {
    let userA = req.session.user
    let id = req.session.user._id
    let cartCount = await userHelperse.getCartCount(id)
    console.log(cartCount,'///////////jdkfjkfdkfdjkfjgkfdgfd');
    productHelperse.getAllProduct().then((products) => {
      productHelperse.getAllCategory().then((ctdata) => {
        res.render('users/index', { user: true, products,userA, ctdata,cartCount, exist: req.session.exist, msg: req.session.message });
        req.session.exist = null
        req.session.message = null
      })
    })
  }
  let userA = req.session.user
  productHelperse.getAllProduct().then((products) => {
    productHelperse.getAllCategory().then((ctdata) => {
      res.render('users/index', { user: true, userA, products, ctdata });
    })
  })
});



// router.get('/home', (req, res) => {
//   res.redirect('/')
// })



//.....sign upm page calling from loginpage....//
router.get('/user-signup', (req, res) => {
  res.render('users/user-signup')
})



//...user-signup...//
router.post('/usersignup', (req, res) => {
  userHelperse.dosignup(req.body).then((response) => {
    if (response.status == false) {
      res.render('users/user-login')
    } else {
      res.redirect('/userlogin')
    }
  })
})
router.get('/userlogin', (req, res, next) => {
  res.render('users/user-login')
})

router.post("/login", (req, res) => {
  userHelperse.dologin(req.body).then((response) => {
    if (response.status) {
      userHelperse.isBlocked(response.user._id).then(() => {
        if (response.status) {
          req.session.loggdin = true
          req.session.user = response.user
          if (req.session.user.RefRevard == true) {
            res.render("users/referal-page");
          } else {
            res.redirect('/')
          }
        }
      }).catch((error) => {
        req.session.blocked = error
        res.redirect('/user-signup')
      })
    } else {
      req.session.loginer = 'inavlied credential'
      res.redirect("/userlogin");
    }
  });
})



//...blocking and unblock...//
router.get('/index/block/:id', (req, res) => {
  let blockId = req.params.id
  userHelperse.blockUser(blockId).then(() => {
    res.redirect('/admin/userlist-table')
  })
})



//...Unblock...//F
router.get('/index/unblock/:id', (req, res) => {
  let blockId = req.params.id
  userHelperse.unBlock(blockId).then(() => {
    res.redirect('/admin/userlist-table')
  })
})


router.get('/card-view', (req, res) => {
  let userA = req.session.user
  productHelperse.getAllProduct(userA).then((products) => {
    res.render('users/card-view', { user: true, products });
  })
})




//....logout....//
router.get("/logout", (req, res) => {
  res.header(
    "Cache-Control",
    "no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0"
  );
  req.session.user = null;
  req.session.loggedind = false
  res.redirect("/");
});



//...get-category-prducts..//
router.get('/get-Category-products/:id', async (req, res) => {
  let userA = req.session.user
  let getctprID = req.params.id
  let id = req.session.user._id
  let cartCount = await userHelperse.getCartCount(id)
  productHelperse.getCategoryProdcut(getctprID).then((product) => {
    productHelperse.getAllCategory().then((ctdata) => {
      res.render('users/category-view', { user: true, userA, product, ctdata, cartCount });
    })
  })
})


//.....get singlecategory.....//
router.get('/singleproduct/:id', async (req, res) => {
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
})



//...add to cart...//
router.get('/add-to-cart/:id',verifyLogin,(req, res) => {
  let proId = req.params.id
  if (req.session.user) {
    let userId = req.session.user._id
    userHelperse.addTocart(proId, userId).then(() => {
      res.json({ status: true })
    })
  } else {
    res.redirect('/userlogin')
  }

})



router.get('/cart', verifyLogin, async (req, res, next) => {
  let userId = req.session.user._id
  let cartItems = await userHelperse.getItems(userId)
  let userA = req.session.user
  let id = req.session.user._id
  let Totalemount = await userHelperse.getTotal(id)
  let cartCount = await userHelperse.getCartCount(id)
  productHelperse.getAllCategory().then((ctdata) => {
    res.render('users/cart', { user: true, userA, ctdata, cartItems, cartCount, Totalemount })
  })


}),



  router.post('/change-product-quantity',verifyLogin,(req, res) => {
    userHelperse.changeproductQuantity(req.body).then(async (countData) => {
      countData.Total = await userHelperse.getTotal(req.body.user)
      res.json(countData)
    })
  }),



  router.post('/Remove-from-Cart',verifyLogin,(req, res) => {
    userHelperse.removeCartProduct(req.body).then((response) => {
      res.json(response)
    })
  }),



  router.get('/order', verifyLogin, async (req, res, next) => {
    let id = req.session.user._id
    let userA = req.session.user
    let cartItems = await userHelperse.getItems(id)
    let Total = await userHelperse.getTotal(id)
    let savedAdress = await userHelperse.takeadress(id)
    res.render('users/order', { user: true, Total, userA, cartItems, savedAdress})
  }),

  router.post('/place-order', async (req, res, next) => {
    let id = req.session.user._id
    let product = await userHelperse.getAllproductList(id)
    let data = req.body
    console.log(req.session.couponAmount,'//////////////////aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
    if (req.session.couponAmount){
       if(req.session.couponAmount.status){
        console.log(req.session.couponAmount.FinalAmount,'coupon eamoun t');
        let total = req.session.couponAmount.FinalAmount.toFixed()
        userHelperse.placeOrder(data, product, total, id).then((response) => {
          if (req.body['selectedPayment'] === 'COD') {
            res.json({ Codsuccess: true })
          } 
          else {
            userHelperse.genarateRazorPay(response, total).then((response) => {
              res.json(response)
            })
          }
        })
       }else if(req.session.couponAmount.ok){
        console.log(req.session.couponAmount.finalAmount,'maximum emount');
        let total = req.session.couponAmount.finalAmount.toFixed()
        userHelperse.placeOrder(data, product, total, id).then((response) => {
          if (req.body['selectedPayment'] === 'COD') {
            res.json({ Codsuccess: true })
          }else{
            userHelperse.genarateRazorPay(response, total).then((response) => {
              res.json(response)
            })
          }
        })
      }
    }else{
      let Total = await userHelperse.getTotal(id)
      userHelperse.placeOrder(data, product, Total, id).then((response) => {
        if (req.body['selectedPayment'] === 'COD') {
          res.json({ Codsuccess: true })
          }else {
          userHelperse.genarateRazorPay(response, Total).then((response) => {
            res.json(response)
          })
        }
      })
    }
  }),
  
  router.get('/Add-adress', async (req, res) => {
    let userA = req.session.user
    let getctprID = req.params.id
    let id = req.session.user._id
    req.session.user
    let cartCount = await userHelperse.getCartCount(id)
    productHelperse.getCategoryProdcut(getctprID).then((product) => {
      productHelperse.getAllCategory().then((ctdata) => {
        res.render('users/Add-adress', { user: true, userA, product, ctdata, cartCount, message: req.session.message });
        req.session.message = null
      })
    })
  }),



  router.post('/Add-adress', (req, res) => {
    userId = req.session.user._id
    adressData = req.body
    req.session.message = 'Adress successfully added'
    userHelperse.AddAdress(userId, adressData)
    res.redirect('/Add-adress')
  })



router.post('/ADD-AD', (req, res) => {
  userId = req.session.user._id
  adressData = req.body
  req.session.message = 'Adress successfully added'
  userHelperse.AddAdress(userId, adressData)
  res.redirect('/order')
})




router.post('/address-remove', (req, res) => {
  userHelperse.removeAdress(req.body).then((response) => {
    res.json(response)
  })
})



router.get('/addTo-wishlist/:id', verifyLogin, (req, res) => {
  let productId = req.params.id
  let userId = req.session.user._id
  userHelperse.addtowishlist(productId, userId).then((response) => {
    if (response.message){
      req.session.exist = "Already in wishlist"
      res.redirect('/')
    } else {
      req.session.exist = "successfully added to wishlist"
      res.redirect('/')
    }
  })
})



router.get('/wishlist', verifyLogin, async (req, res) => {
  userId = req.session.user._id
  let userA = req.session.user
  let wishitems = await userHelperse.getWishItems(userId)
  let cartItems = await userHelperse.getItems(userId)
  let cartCount = await userHelperse.getCartCount(userId)
  productHelperse.getAllCategory().then((ctdata) => {
    res.render('users/wish-list', { user: true, userA, ctdata, cartItems, cartCount, wishitems })
  })
})



router.post('/remove-from-wishlist', (req, res) => {
  userHelperse.RemoveFromwishlist(req.body).then((response) => {
    res.json(response)

  })
})



router.get('/order-history', async (req, res) => {
  userid = req.session.user._id
  let history = await userHelperse.getHistory(userid)
  res.render('users/order-list', { user: true, history })
})



router.get('/user/view-product/', async (req, res) => {
  let orderId = req.query.id
  let userA = req.session.user
  let odproducts = await userHelperse.getOrderedProducts(orderId)
  res.render('users/orderd-products', { user: true, userA, odproducts })
})



router.get('/orderSuccess', async (req, res) => {
  userid = req.session.user._id
  let history = await userHelperse.getHistory(userid)
  res.render('users/orderSuccess', { history })
})




router.post('/return-product', (req, res) => {
  let oId = req.body
  userHelperse.ProductReturn(oId).then((response) => {
    res.json({ ok: true })
  })
})




router.post('/cancel-order', (req, res) => {
  orid = req.body
  userHelperse.CancelOrder(orid).then((response) => {
    res.json(response)
  })
}),


  router.post('/verify-payment', (req, res) => {
    userHelperse.verifypayment(req.body).then(() => {
      userHelperse.ChangePaymentStatus(req.body['order[receipt]'])
      res.json({ status: true })
    }).catch((err) => {
      res.json({ status: false, errMsg: "" })
    })
  })
router.get('/wallet', (req, res) => {
  res.render('users/wallet')
})



router.post('/apply-refferal', (req, res) => {
  let referalide = req.body
  let userId = req.session.user._id
  userHelperse.SignUpReward(referalide,userId).then((response) => {
    if (response.ok) {
      req.session.message = "Amount Credited to you wallet"
      res.redirect('/')
    } else {
      req.session.message = "invalied Referal Code"
      res.redirect('/')
    }
  })
})
router.get('/offers-page', (req, res) => {
  userA = req.session.user
  res.render('users/offers-page', { user: true, userA })
})
router.post('/apply-coupon', (req, res) => {
  let TotalAmount = req.body.TotalAmount
  let Code = req.body.Couponcode
  let userId = req.session.user._id
  userHelperse.applyCoupon(TotalAmount, Code, userId).then((response) => {
    req.session.couponAmount = response
    console.log(response,';;;;;;;;;;;;;;;;;');
    res.json(response)
  })

})
router.get('/wallet-info', (req, res) => {
  res.render("users/Wallet-page")
})
router.get('/skip', (req,res) => {
  let usid=req.session.user._id
  console.log(usid,'///////////////////////');
  userHelperse.editReferal(usid).then((response)=>{
    res.redirect('/')
  })
})
 //..................../  OTP  /................//
 router.get('/login-Otp',(req,res)=>{
  let message= req.session.mobileError
  res.render('users/mobile',{message})
  req.session.mobileError=null
 })
 router.post('/enterOtp', (req, res, next) =>{
 let mobileNumber=req.body.mobile
  console.log(mobileNumber,'//////////////////');
  userHelperse.verifyMobile(mobileNumber).then((response) => {
    //console.log(response.status,'////response');
    if (response.status == false) {
      req.session.mobileError = "Please Enter a Registered Mobile Number! ";
      res.redirect('/login-Otp');
    } else if (response.active == true) {
      req.session.mobileError = "Your account is Blocked!";
      res.redirect('/otpLogin');
    } else {
      req.session.mobileNumber = req.body.mobile
      mobile = `+91${req.body.mobile}`
      otpHelperse.sendOTP(mobile).then((data) =>{
        res.render('users/OTP')
      })
    }
  })
  //////////////////////////
})
router.post('/verifyOtp', (req, res, next) => {

  let number = (req.body.A + req.body.B + req.body.C + req.body.D + req.body.E + req.body.F)
  console.log(number,'///OTP""???????');
  OTP = (number)
  otpHelperse.verifyOTP(OTP).then( async (response) => {
    if (response.status) {
      mobileNumber = req.session.mobileNumber
      req.session.mobileNumber = null
      req.session.user = await userHelperse.getdataByotp(mobileNumber)
      res.redirect('/');
    }
    else {
      req.session.otpError = "Invalid OTP";
      res.redirect('otp-enter');
    }
  })
});

router.get('/otp-enter',(req,res)=>{
  let eror =req.session.otpError
    res.render('users/OTP',{eror})
    req.session.otpError=null
})
router.get('/wallet_history',verifyLogin,async (req,res)=>{
  let userA=req.session.user
  let transferData = await userHelperse.fetchData(req.session.user._id)
  let cartCount = await userHelperse.getCartCount(req.session.user._id)
  productHelperse.getAllCategory().then((ctdata) => {
  res.render('users/wallet-History',{user:true,transferData,userA,cartCount,ctdata})
  })
})



module.exports = router;
