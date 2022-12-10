var db = require('../config/connection')
var collection = require('../config/collection')
const { response } = require('../app')
var objectid = require('mongodb').ObjectId
var moment = require('moment');

module.exports = {


  /*................................Get All Products........................*/

  getAllProduct: () => {
    return new Promise(async (resolve, reject) => {
      try {
        let products = await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
        resolve(products)
      } catch (error) {
        let eror = {}
        eror.message = 'something went wrong'
        reject(eror)
      }
    })
  },

  /*>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>*/



  /*............................Add-Productp................................*/



  addProduct: (products, callback) => {
    db.get().collection(collection.PRODUCT_COLLECTION).insertOne(products).then((data) => {
      callback(data.insertedId)
    })
  },

  /*>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>*/



  /*............................Get-All-Category................................*/

  getAllCategory: () => {
    return new Promise(async (resolve, reject) => {
      try {
        let categoryList = await db.get().collection(collection.CATEGORY_COLLECTION).find().toArray()
        resolve(categoryList)
      } catch (err) {
        let eror = {}
        eror.message = 'something went wrong'
        reject(eror)
      }
    })
  },


  /*>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>*/


  /*............................Get-All-Category................................*/


  insertCategory: (data) => {
    console.log(data.category, ';....');
    return new Promise(async (resolve, reject) => {

      try {
        let CategoryData = await db.get().collection(collection.CATEGORY_COLLECTION).findOne({ "category": data.category.toLowerCase() })
        if (CategoryData) {
          resolve({ message: false })
        } else {
          await db.get().collection(collection.CATEGORY_COLLECTION).insertOne({ category: data.category })
          resolve({ message: true })
        }
      } catch (err) {
        console.log(err);
        let error = {}
        error.message = 'somthing went wrong'
        reject(error)
      }
    })
  },


  /*>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>*/








  deleteProduct: (prId) => {
    return new Promise((resolve, reject) => {
      db.get().collection(collection.PRODUCT_COLLECTION).deleteOn({ _id: objectid(pr) }).then((response) => {
        resolve(response)
      }).catch((err)=>{
        console.log(err);
        let error={}
        error.message = 'somthing went wrong'
        reject(error)
      })
    })
  },



  //....edite product product adding to the form....//
  getProductdetails: (productId) => {
    return new Promise((resolve, reject) => {
      db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: objectid(productId) }).then((response) => {
        resolve(response)
      }).catch((err)=>{
        let error={}
        error.message = 'somthing went wrong'
        reject(error)
      })
    })
  },

  updateproduct: (productid, productdata) => {
    return new Promise((resolve, reject) => {
      db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: objectid(productid) }, {
        $set: {
          productname: productdata.productname,
          productdiscription: productdata.productdiscription,
          price: productdata.price,
          category: productdata.category
        }
      }).then((response) => {
        resolve(response)
      })
    })
  },



  deletCategory: async(data) => {
    return new Promise(async (resolve, recject) => {
       await db.get().collection(collection.PRODUCT_COLLECTION).findOne({ category: data }).then((response)=>{
        console.log(response,'length');
        if (response) {
          resolve({ message: true })
        } else {
          db.get().collection(collection.CATEGORY_COLLECTION).deleteOne({ category: data }).then((response) => {
            resolve({ message: false })
          }).catch((err)=>{
            let error={}
           error.message = 'somthing went wrong'
           recject(error)
         })
        }
       }).catch((err)=>{
         let error={}
        error.message = 'somthing went wrong'
        recject(error)
      })
      })
  },




  editeCategory: (data) => {
    return new Promise((resolve, reject) => {
      db.get().collection(collection.CATEGORY_COLLECTION).findOne({ _id:objectid(data) }).then((response) => {
        console.log(response,'//////response');
        resolve(response)
      }).catch((err)=>{
        let error={}
        error.message = 'somthing went wrong'
        reject(error)
      })
    })
  },






  updateCategory: (ctID, ctbodydata) => {
    return new Promise((resolve, reject) => {
      db.get().collection(collection.CATEGORY_COLLECTION).updateOne({ _id: objectid(ctID) }, {
        $set: {
          category: ctbodydata.category
        }
      }).then((response) => {
        resolve()
      })
    })
  },




  getCategoryProdcut: (ctpDta) => {
    return new Promise(async (resolve, reject) => {
      let product = await db.get().collection(collection.PRODUCT_COLLECTION).find({ category: ctpDta }).toArray()
      resolve(product)
    })
  },



  getSingleProduct: (singlePrId) => {

    return new Promise((resolve, reject) => {

      db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: objectid(singlePrId) }).then((response) => {
        resolve(response)
      })

    })
  },
  getMonthsale: () => {
    return new Promise(async (resolve, reject) => {
      let Month = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
        {
          $match: { 'status': { $nin: ['Cancelled'] } }
        },
        {
          $group: {
            _id: { month: { $month: { $toDate: '$date' } } },
            totalSaleMonth: { $sum: '$totalAmount' }
          }
        },
        {
          $sort: { "_id.month": -1 }
        },
        {
          $limit: 6
        },
        {
          $project: {
            _id: 0,
            month: '$_id.month',
            totalSaleMonth: 1,
          }
        }
      ]).toArray()
      Month.forEach(element => {
        function toMonthName(Month) {
          const date = new Date();
          date.setMonth(Month - 1);
          return date.toLocaleString('en-US', {
            month: 'long',
          });
        }
        element.month = toMonthName(element.month)
      });
      resolve(Month)
    })
  },
  CancelRefundAmount: (userId, Amount, info, orderID) => {
    let user = objectid(userId)
    let CancelRefundData = {
      about: info,
      Ordetid: orderID,
      Amount: Amount,
      Date: moment().format('MMMM Do YYYY, h:mm:ss a'),
    }
    return new Promise((resolve, reject) => {
      db.get().collection(collection.USERS_COLLECTION).updateOne({ _id: user }, {

        $inc: { WalletAmount: Amount },
        $push: { TransferDetails: CancelRefundData },
        $set: {
          CancelRefund: true
        }
      }).then((response) => {
        resolve(response)
      })
      db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: objectid(orderID) }, {
        $set: {
          CancelRefund: true
        }
      })
      resolve()
    })
  },



  ReturnRefundAmount: (userid, Amount, info, ordId) => {
    let RetunRefundData = {
      about: info,
      Ordetid: ordId,
      Amount: Amount,
      Date: moment().format('MMMM Do YYYY, h:mm:ss a'),
    }
    let usid = objectid(userid)
    return new Promise((resolve, reject) => {
      db.get().collection(collection.USERS_COLLECTION).updateOne({ _id: usid }, {
        $inc: { WalletAmount: Amount },
        $push: { TransferDetails: RetunRefundData },
        $set: {
          ReturnRefund: true
        }


      }).then((response) => {
        resolve(response)
      })
      db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: objectid(ordId) }, {
        $set: {
          Returnrefund: true
        }
      })
      resolve()

    })

  },




  getwalInfo: (usId) => {
    let cancelrefund
    return new Promise(async (resolve, reject) => {
      let wal = await db.get().collection(collection.WALLET_COLLECTION).find({ userId: objectid(usId) }).toArray()
      let refund = wal[0].CancelRefund
      cancelrefund = refund
      resolve(cancelrefund)
    })
  },



  // InsetOffer:(persentage, MaxiAmount, about, CouponCode,expiry) => {
  //   console.log(expiry,'/////////////////////////////;;;;;;;;;;;;;;;;;;;;;');
  //   let couponObejct={}
  //   return new Promise(async(resolve, reject) => {
  //     var addDays = function (str, days){
  //       var myDate = new Date(str);
  //       myDate.setDate(myDate.getDate() + parseInt(days));
  //       return myDate;
  //      }
  //     couponObejct.MaximumEmount=MaxiAmount
  //     couponObejct.Persantage=persentage
  //     couponObejct.About=about
  //     couponObejct.code=CouponCode
  //     couponObejct.expiry = addDays(new Date(),expiry)
  //     await db.get().collection(collection.OFFER_COLLECTION).createIndex({ "expiry": 1 }, { expireAfterSeconds: 0 })
  //     await db.get().collection(collection.OFFER_COLLECTION).insertOne(couponObejct)
  //     resolve()
  //   })
  // },

  InsetOffer: (persentage, MaxiAmount, about, CouponCode, expiry, startingDate, minParchase) => {
    console.log(expiry, '/////////////////////////////;;;;;;;;;;;;;;;;;;;;;');
    console.log(startingDate, 'haiwa that st date  here');
    let couponObejct = {}
    let ExpDate = new Date(expiry)
    let StDate = new Date(startingDate)
    return new Promise(async (resolve, reject) => {
      couponObejct.MaximumEmount = MaxiAmount
      couponObejct.Persantage = persentage
      couponObejct.About = about
      couponObejct.code = CouponCode
      couponObejct.ExpiryDate = ExpDate
      couponObejct.startingDate = StDate
      couponObejct.MiniumParchaseAmount = minParchase
      await db.get().collection(collection.OFFER_COLLECTION).insertOne(couponObejct)
      resolve()
    })
  },





  Findcoupens: () => {
    return new Promise((resolve, reject) => {
      let Offers = db.get().collection(collection.OFFER_COLLECTION).find().toArray()
      resolve(Offers)

    })
  },
  DeleteCoupon: (couponID) => {
    console.log(couponID, '--------------cpn--------------');
    return new Promise((resolve, reject) => {
      db.get().collection(collection.OFFER_COLLECTION).deleteOne({ _id: objectid(couponID) }).then((response) => {
        resolve(response)
      })

    })
  }




}