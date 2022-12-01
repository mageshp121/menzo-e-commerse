var express = require('express');
const { Db } = require('mongodb');
const { response } = require('../app');
var router = express.Router();
var productHelperse = require('../helperse/productHelperse');
const { verifyMobile } = require('../helperse/userHelperse');
const userHelperse = require('../helperse/userHelperse');



const preadminmail = "magesh@gmail.com"
const prepss = "1122"
 /* GET users listing. */
 const verifyadmin = (req, res, next) => {
   if (req.session.admin) {
     next()
   } else {
      res.redirect('/admin')
   }
 }

router.get('/',(req, res,next) =>{
   let admin=req.session.admin
   if(admin){
     res.redirect('/admin/adminhome')
   }
   res.render('admin/admin-login')
 })

router.post('/admin-login',(req,res)=>{
   let data=req.body
   const admindata={mail,password}=data
   if(preadminmail===mail && prepss===password){
      req.session.admin=admindata
      req.session.adminlogdin=true
      res.redirect('/admin/adminhome')
   }else{
      req.session.eror='invalied credentilas'
      res.redirect('/admin')
   }

   console.log(data,'.>>>>>>>>>>>>>>>>>>>>Ghghg>>>>ncjhsagbcd');
})


















router.get('/adminhome', async (req, res, next) =>{
   let admin=req.session.admin   
   if(admin){
      let getMOnths = await productHelperse.getMonthsale()
      res.render('admin/admin-home', { admin: true, layout: 'admin', getMOnths });
   }else{
     redirect('/admin/admin-login')
   }   
   
});

/*..............................product management........................*/

router.get('/product-manage', async (req, res) => {
   productHelperse.getAllProduct().then((products) => {
      res.render('admin/product-manage', { admin: true, layout: 'admin', products })
   })

})

router.get('/add-product', (req, res) => {
   productHelperse.getAllCategory().then((ctdata) => {
      res.render('admin/add-product', { admin: true, layout: 'admin', ctdata })
   })
})

router.post('/add-product', (req, res) => {
   req.body.price = parseInt(req.body.price)
   productHelperse.getAllCategory().then((ctdata) => {
      productHelperse.addProduct(req.body, (id) => {
         let image = req.files.image;
         image.mv('./public/product-images/' + id + '.jpg', (err, done) => {
            if (!err) {
               res.render('admin/add-product', { admin: true, layout: 'admin', ctdata })
            } else {
               console.log(err);
            }
         })
      })
   })

})


/*.............category mangement...........*/



router.get('/add-category', (req, res) => {
   res.render('admin/add-category', { admin: true, layout: 'admin', CateMessage: req.session.CateEXIst,text:"here here" })
   req.session.CateEXIst = null
})


router.post('/add-category', (req, res) => {
   let add = req.body
   console.log(add,'////////////???????????Agsyagsagaga');
   productHelperse.insertCategory(add).then((response) => {
      if (response.message) {
         req.session.CateEXIst = "Category added"
         // res.redirect('/admin/add-category')
         res.json({ok:true})
      } else {
         req.session.CateEXIst = "Soryy Category alreadyexist"
         // res.redirect('/admin/add-category')
         res.json({ok:false})
      }
   })


})

router.get('/category-manage', (req, res) => {
   productHelperse.getAllCategory().then((ctdata) => {
      res.render('admin/category-manage', { admin: true, layout: 'admin', ctdata, productExist: req.session.productExist })
      req.session.productExist = null
   })
})


/*.......................... delete and edite product........*/



router.get('/delete-product/:id', (req, res) => {
   var prId = req.params.id
   productHelperse.deleteProduct(prId).then((response) => {
      res.redirect('/admin/product-manage')
   })

})

/*...............................edite-product..........................*/


router.get('/edite-product/', async (req, res) => {
   let Details = req.query.id
   let products = await productHelperse.getProductdetails(Details)
   res.render('admin/edite-product', { admin: true, layout: 'admin', products })
}),

   /*........................edite product........................*/


   router.post('/edite-product/:id', (req, res) => {
      let id = req.params.id
      productHelperse.updateproduct(req.params.id, req.body).then(() => {
         res.redirect('/admin/product-manage')
         if (req.files.image){
            let image = req.files.image
            image.mv('./public/product-images/' + id + '.jpg')
         }
      })
   })


/*..........................delete category............................*/


router.get('/delete-category/:categoryName', (req, res) => {
   let ctId = req.params.categoryName
   productHelperse.deletCategory(ctId).then((response) => {
      if (response.message) {
         req.session.productExist = "Category is not empty, cannot performe delete"
         res.redirect('/admin/category-manage')
      } else {
         res.redirect('/admin/category-manage')
      }

   })


})



/*.............. .....edite category..........................*/


router.get('/edite-category/', async (req, res) => {
   let ctDetails = req.query.id
   let ctbody = await productHelperse.editeCategory(ctDetails)
   res.render('admin/edite-category', { admin: true, layout: 'admin', ctbody })
})

router.post('/update-category/:id', (req, res) => {
   catgData = req.params.id
   const obj = Object.assign({}, req.body)
   productHelperse.updateCategory(catgData, obj).then(() => {
      res.redirect('/admin/edite-category')
   })
})


/*......................user mangement.....................*/


router.get('/userlist-table', (req, res) => {
   userHelperse.getAllusers().then((userdata) => {
      res.render('admin/userlist-table', { admin: true, layout: 'admin', userdata })
   })
})


/*....................Delete-userdata.........................................*/

router.get('/delete-userdata/:id',verifyadmin, (req, res) => {
   let deleteID = req.params.id
   userHelperse.deleteUserData(deleteID).then(() => {
      res.redirect('/admin/userlist-table')
   })
})


/*.................................order-manage.............................*/

router.get('/order-manage/', async (req, res) => {
     let value=req.query.data
    //console.log(req.query.data);
     if(value){
      number=parseInt(value)
     }else{
      number=1
     }
     console.log(number,'///////???????????????');
    let OrderDetails = await userHelperse.getOdDetails(number)
    let count = await userHelperse.getCount()
    let pagelimit=10
    let limit=Math.ceil(count/pagelimit)
    let NofPage=[]
     for(i=1;i<=limit;i++){
      NofPage.push(i)
     }
   res.render('admin/order-list', { admin: true, layout: 'admin', OrderDetails,NofPage})
})

router.post('/update-order-status',verifyadmin,(req, res) => {
   let StatusData = req.body;
   userHelperse.UpdateStatus(StatusData).then((response) => {
      res.json(response)
   })


}),

   /*....................RefundMangment..................*/


   router.post('/CancelRE',verifyadmin,(req, res) => {
      let userId = req.body.userId
      let rs = req.body.Amount
      let Amount = parseFloat(rs)
      let ReInfo = req.body.info
      let orderID = req.body.orderid
      productHelperse.CancelRefundAmount(userId, Amount, ReInfo, orderID)
      res.redirect('order-manage')
   })
router.post('/ReturnRe',verifyadmin,(req, res) => {
   let data = req.body
   let userid = req.body.userId
   let amount = parseInt(req.body.Amount)
   let reinfo = req.body.info
   let orId = req.body.orderid
   productHelperse.ReturnRefundAmount(userid, amount, reinfo, orId)
   res.redirect('order-manage')


})
/*................Offer-manage...............*/

router.get('/offer-manage', (req, res) => {
   productHelperse.Findcoupens().then((offers) => {
      console.log(offers,'//////////ggrehhhhhhhhhhhhhhhhhhh');
      res.render('admin/Offer-Manage', { admin: true, layout: 'admin', offers })
   })

})
router.get('/Add-Offer', (req, res) => {
   res.render('admin/Add-Offer', { admin: true, layout: 'admin' })
})
router.post('/ADD-Offer',verifyadmin,(req, res) => {
   
   console.log(req.body,'req.body here');
   let persentage = parseInt(req.body.Persantage)
   let MaxiAmount = parseInt(req.body.MaximunAmount)
   let minParchase= parseInt(req.body.minParchase)
   let about = req.body.About
   let CouponCode = req.body.Couponcode
   let expiry = req.body.expiry
   let startingDate=req.body.starting
   productHelperse.InsetOffer(persentage, MaxiAmount, about, CouponCode, expiry,startingDate,minParchase).then(() => {
      res.redirect('Add-Offer')
   })

})
router.get('/Delete-Offer/:id',verifyadmin,(req,res)=>{
    let CouponeId=req.params.id
    console.log(CouponeId,'<<<<< coupon Id >>>>>>>>>');
    productHelperse.DeleteCoupon(CouponeId).then((response)=>{
      res.redirect('/admin/offer-manage')
      //res.send('hai daaa')
    })
})

module.exports = router;
