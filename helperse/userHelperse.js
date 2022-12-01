var db = require('../config/connection')
var collection = require('../config/collection')
var bcrypt = require('bcrypt')
const { ObjectID } = require('bson')
const { response } = require('../app')
const { uid } = require('uid')
const { Collection, ReturnDocument, MongoMissingCredentialsError, MongoNetworkError } = require('mongodb')
const { ORDER_COLLECTION } = require('../config/collection')
const Razorpay = require('razorpay');
const { resolve } = require('path')
const { log } = require('console')
var moment = require('moment');

/*.......razor pay Instence......*/
var instance = new Razorpay({
    key_id: 'rzp_test_ESLJkTRKX7FKo3',
    key_secret: 'U7nLQZty4r5XQJMDTzrHcGbn',
});

module.exports = {

    dosignup: (userdata) => {
        userdata.adress = [];
        userdata.TransferDetails = []
        let id = uid()
        return new Promise(async (resolve, reject) => {
            let user = await db.get().collection(collection.USERS_COLLECTION).findOne({ email: userdata.email })
            if (user) {
                resolve({ status: false })
            } else {
                userdata.password = await bcrypt.hash(userdata.password, 10)
                userdata.status = true
                userdata.blocked = false
                userdata.RefRevard = true
                userdata.referalId = id
                userdata.CancelRefund = false
                userdata.WalletAmount = 0
                userdata.ReturnRefund = false
                db.get().collection(collection.USERS_COLLECTION).insertOne(userdata)
                resolve(userdata)
            }
        })
    },

    dologin: (userdata) => {
        return new Promise(async (resolve, reject) => {
            let loginstatus = false
            let response = {}
            let user = await db.get().collection(collection.USERS_COLLECTION).findOne({ email: userdata.email })
            if (user) {
                bcrypt.compare(userdata.password, user.password).then((status) => {
                    if (status) {
                        console.log("login success")
                        response.user = user
                        response.status = true
                        resolve(response)
                    } else {
                        console.log('login failed');
                        resolve({ status: false })
                    }
                })
            } else {
                resolve({ status: false })
            }
        })
    },

    getAllusers: () => {
        return new Promise((resolve, recject) => {
            let userdata = db.get().collection(collection.USERS_COLLECTION).find().toArray()
            resolve(userdata)
        })
    },

    blockUser: (userId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.USERS_COLLECTION).updateOne({ _id: ObjectID(userId) }, {
                $set: {
                    blocked: true
                }
            })
            resolve()
        })
    },
    unBlock: (userId) => {
        return new Promise((resolve, rejecte) => {
            db.get().collection(collection.USERS_COLLECTION).updateOne({ _id: ObjectID(userId) }, {
                $set: {
                    blocked: false
                }
            })
            resolve()
        })
    },

    isBlocked: (userdata) => {
        return new Promise(async (resolve, reject) => {
            let blocked = await db.get().collection(collection.USERS_COLLECTION).findOne({ $and: [{ _id: ObjectID(userdata) }, { blocked: true }] })
            if (blocked) {
                let error = "sorry,user is blocked by Athorized"
                reject(error)
            } else {
                resolve()
            }
        })
    },

    deleteUserData: (deleteID) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.USERS_COLLECTION).deleteOne({ _id: ObjectID(deleteID) }).then(() => {
                resolve()
            })
        })
    },
    addTocart: (proId, userId) => {
        let probj = {
            item: ObjectID(proId),
            quantity: 1
        }
        return new Promise(async (resolve, recject) => {
            let UserCart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: ObjectID(userId) })
            if (UserCart) {
                // want to find element is exist or not
                let proExist = UserCart.product.findIndex(product => product.item == proId)
                if (proExist != -1) {
                    db.get().collection(collection.CART_COLLECTION)
                        .updateOne({ uuser: ObjectID(userId), 'product.item': ObjectID(proId) }, {
                            $inc: { 'product.$.quantity': 1 }
                        }).then(() => {
                            resolve()
                        })
                } else {
                    //user is exist cart exist 
                    db.get().collection(collection.CART_COLLECTION).updateOne({ user: ObjectID(userId) }, {
                        $push: {
                            product: probj
                        }
                    }).then((response) => {
                        resolve()
                    })
                }
            } else {
                //user exist cart not exist
                let cartobj = {
                    user: ObjectID(userId),
                    product: [probj]
                }
                db.get().collection(collection.CART_COLLECTION).insertOne(cartobj).then((response) => {
                    resolve()
                })
            }
        })
    },
    getItems: (userId) => {
        return new Promise(async (resolve, recject) => {
            let cartproduct = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: ObjectID(userId) }
                },
                {
                    $unwind: '$product'
                }, {
                    $project: {
                        item: '$product.item',
                        quantity: '$product.quantity'
                    }
                }, {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'productDetails'
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, productDetails: { $arrayElemAt: ['$productDetails', 0] }
                    }
                }
            ]).toArray()
            resolve(cartproduct)
        })
    },
    getCartCount: (userId) => {
        return new Promise(async (resolve, recject) => {
            let count = 0
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: ObjectID(userId) })
            if (cart) {
                count = cart.product.length
            }
            resolve(count)
        })
    },
    changeproductQuantity: (IDetails) => {
        IDetails.count = parseInt(IDetails.count)
        IDetails.quantity = parseInt(IDetails.quantity)
        return new Promise((resolve, reject) => {
            if (IDetails.count == -1 && IDetails.quantity == 1) {
                db.get().collection(collection.CART_COLLECTION)
                    .updateOne({ _id: ObjectID(IDetails.cart) }, {
                        $pull: { product: { item: ObjectID(IDetails.productDetails) } }
                    }
                    ).then((response) => {
                        resolve({ removeProduct: true })

                    })
            } else {
                db.get().collection(collection.CART_COLLECTION)
                    .updateOne({ _id: ObjectID(IDetails.cart), 'product.item': ObjectID(IDetails.productDetails) }, {
                        $inc: { 'product.$.quantity': IDetails.count }
                    }).then((response) => {
                        resolve({ status: true })
                    })

            }
        })
    },
    removeCartProduct: (cardId) => {
        return new Promise(async (resolve, recject) => {
            db.get().collection(collection.CART_COLLECTION)
                .updateOne({ _id: ObjectID(cardId.cart) }, {
                    $pull: { product: { item: ObjectID(cardId.productDetails) } }
                }
                ).then((response) => {
                    resolve(true)
                })
        })
    },

    getTotal: (userId) => {
        return new Promise(async (resolve, recject) => {
            let Totalemnt = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: ObjectID(userId) }
                },
                {
                    $unwind: '$product'
                },
                {
                    $project: {
                        item: '$product.item',
                        quantity: '$product.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'productDetails'
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, productDetails: { $arrayElemAt: ['$productDetails', 0] }
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: { $multiply: ['$quantity', '$productDetails.price'] } }
                    }
                }

            ]).toArray()
            // if(Totalemnt.length !== 0){
            //     resolve(Totalemnt[0].total)
            // }else{
            //     let value=0
            //     resolve(value)
            // }
            resolve(Totalemnt[0]?.total)
        })
    },
    AddAdress: (userId, AdressData) => {
        return new Promise((resolve, reject) => {
            let count = uid()
            let adresobj = {
                id: count,
                Name: AdressData.Name,
                Phone: AdressData.Phone,
                Email: AdressData.Email,
                City: AdressData.Town,
                state: AdressData.state,
                Adress: AdressData.adress,
                pincode: AdressData.Pincode
            }
            db.get().collection(collection.USERS_COLLECTION).updateOne({ _id: ObjectID(userId) }, {
                $push: {
                    adress: adresobj
                }
            }).then((response) => {
                resolve()
            })
        })
    },
    getAllproductList: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: (ObjectID(userId)) })
            resolve(cart?.product)
        })
    },
    placeOrder: (order, product, total, userId) => {
        return new Promise(async (resolve, reject) => {
            let adressid = order.selectedAdress
            let newadress = await db.get().collection(collection.USERS_COLLECTION)
                .aggregate([
                    {
                        $match: { _id: ObjectID(userId) }
                    },
                    {
                        $unwind: '$adress'
                    },
                    {
                        $project: {
                            id: '$adress.id',
                            Name: '$adress.Name',
                            Mobile: '$adress.Phone',
                            Email: '$adress.Email',
                            address: '$adress.Adress',
                            city: '$adress.Ci          ty',
                            State: '$adress.state',
                            Pincode: '$adress.pincode'
                        }
                    },
                    {
                        $match: { id: adressid }
                    }
                ]).toArray()
            let status = order.selectedPayment === 'COD' ? 'placed' : 'pending'
            let orderObj = {
                deliveryDetails: {
                    Name: newadress[0].Name,
                    Mobile: newadress[0].Mobile,
                    Email: newadress[0].Email,
                    address: newadress[0].address,
                    city: newadress[0].city,
                    State: newadress[0].State,
                    pincode: newadress[0].Pincode,

                },
                userId: ObjectID(userId),
                PaymentMethod: order.selectedPayment,
                products: product,
                totalAmount: total,
                status: status,
                date: moment().format('MMMM Do YYYY, h:mm:ss a'),
                Cancel: true,
                Return: false,
                retured: true,
                procancel: false,
                msg: false,
                cstCancel: false
            }
            db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response) => {
                db.get().collection(collection.CART_COLLECTION).deleteOne({ user: ObjectID(userId) })
                resolve(response.insertedId)
            })
        })
    },
    takeadress: (userId) => {
        return new Promise(async (resolve, reject) => {
            let AddData = await db.get().collection(collection.USERS_COLLECTION).aggregate([
                {
                    $match: { _id: ObjectID(userId) }
                },
                {
                    $unwind: '$adress'
                },
                {
                    $project: {
                        id: '$adress.id',
                        Name: '$adress.Name',
                        Email: '$adress.Email',
                        Phone: '$adress.Phone',
                        City: '$adress.City',
                        state: '$adress.state',
                        Adress: '$adress.Adress',
                        pincode: '$adress.pincode'
                    }
                }
            ]).toArray()
            resolve(AddData)
        })
    },

    removeAdress: (BodyData) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.USERS_COLLECTION).updateOne({ _id: ObjectID(BodyData.userId) }, {
                $pull: { adress: { id: BodyData.adressId } }
            }).then((response) => {
                resolve(true)
            })
        })
    },
    addtowishlist: (productId, userId) => {
        let wishObj = {
            items: ObjectID(productId)

        }
        return new Promise(async (resolve, reject) => {
            userwishlist = await db.get().collection(collection.WISHLIST_COLLECTON).findOne({ user: ObjectID(userId) })
            if (userwishlist) {
                let proExist = userwishlist.product.findIndex(product => product.items == productId)
                if (proExist != -1) {
                    resolve({ massege: true })

                } else {
                    db.get().collection(collection.WISHLIST_COLLECTON).updateOne({ user: ObjectID(userId) }, {
                        $push: {
                            product: wishObj
                        }
                    }).then((response) => {
                        resolve({ message: false })
                    })

                }
            } else {
                let wishlist = {
                    user: ObjectID(userId),
                    product: [wishObj]
                }
                db.get().collection(collection.WISHLIST_COLLECTON).insertOne(wishlist).then((response) => {
                    resolve()
                })
            }
        })
    },
    getWishItems: (userId) => {
        return new Promise(async (resolve, reject) => {
            let userwishproducts = await db.get().collection(collection.WISHLIST_COLLECTON).aggregate([
                {
                    $match: { user: ObjectID(userId) }
                },
                {
                    $unwind: '$product'
                },
                {
                    $project: {
                        items: '$product.items'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'items',
                        foreignField: '_id',
                        as: 'wishProducts'
                    }
                },
                {
                    $project: {
                        items: 1, wishProducts: { $arrayElemAt: ['$wishProducts', 0] }
                    }
                }
            ]).toArray()
            resolve(userwishproducts)
        })
    },
    RemoveFromwishlist: (wisIds) => {
        return new Promise(async (resolve, reject) => {
            db.get().collection(collection.WISHLIST_COLLECTON).updateOne({ _id: ObjectID(wisIds.wishProducts) }, {
                $pull: { product: { items: ObjectID(wisIds.wishlist) } }
            }).then((response) => {
                resolve(true)
            })
        })
    },
    getHistory: (userId) => {
        return new Promise(async (resolve, reeject) => {
            let ordrHistyory = await db.get().collection(collection.ORDER_COLLECTION).find({ userId: ObjectID(userId) }).sort({ _id: -1 }).toArray()
            resolve(ordrHistyory)
        })

    },
    getOrderedProducts: (orId) => {
        return new Promise(async (resolve, reject) => {
            OrderdProducts = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: { _id: ObjectID(orId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'orderpr'
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, orderpr: { $arrayElemAt: ['$orderpr', 0] }
                    }
                }
            ]).toArray()
            resolve(OrderdProducts)
        })
    },

    getOdDetails: (value) => {
        console.log(value,'jjjjjjjjjjjjjjjjjjjjjjjjjjjjjj');
        let pagelimit=10
        return new Promise(async (resolve, reject) => {
            let data = await db.get().collection(collection.ORDER_COLLECTION).find().sort({ _id: -1 }).skip((value-1)*pagelimit).limit(pagelimit).toArray()
            resolve(data)
        })
    },
    getCount:()=>{
      return new Promise(async(resolve,reject)=>{
        let count=await db.get().collection(collection.ORDER_COLLECTION).find().count()
        console.log(count,'///////////>>>>>>>>>>count//////');
        resolve(count)
      })
    },
    UpdateStatus: (StatusData) => {
        let Cancel
        let Return
        if (StatusData.status == 'Cancelled') {
            Cancel = false
        } else {
            Cancel = true
        }
        if (StatusData.status == 'Delivered') {
            Return = true
            Cancel = false
        } else {
            Return = false
        }
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: ObjectID(StatusData.cartId) }, {
                $set: {
                    status: StatusData.status,
                    Return: Return,
                    Cancel: Cancel
                }
            })
            resolve({ ok: true })
        })
    },
    ProductReturn: (oId) => {
        return new Promise((resolve, reeject) => {
            db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: ObjectID(oId.ordId) }, {
                $set: {
                    status: 'retuned',
                    Return: false,
                    retured: false
                }
            })
            resolve({ ok: true })
        })
    },
    CancelOrder: (ordid) => {
        return new Promise(async (resolve, reject) => {
            let payment = await db.get().collection(collection.ORDER_COLLECTION).findOne({ _id: ObjectID(ordid.orderId) })
            if (payment.PaymentMethod == 'COD') {
                db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: ObjectID(ordid.orderId) }, {
                    $set: {

                        status: 'Cancelled',
                        Return: false,
                        procancel: false,
                        retured: false,
                        cstCancel: true,
                        msg: true

                    }
                })
                resolve({ ok: true })
            } else {
                db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: ObjectID(ordid.orderId) }, {
                    $set: {

                        status: 'Cancelled',
                        Return: false,
                        procancel: true,
                        retured: false,
                        msg: true,
                        cstCancel: false,

                    }
                })
                resolve({ ok: true })
            }
        })

    },
    genarateRazorPay: (orderId, totalAmount) => {
        return new Promise((resolve, reject) => {
            var options = {
                amount: totalAmount * 100,  // amount in the smallest currency unit
                currency: "INR",
                receipt: orderId.toHexString()
            };
            instance.orders.create(options, function (err, order) {
                if (err) {
                    console.log(err);
                } else {

                    console.log(order, "otderrrrr");
                    resolve(order)
                }


            });

        })
    },

    verifypayment: (details) => {
        return new Promise((resolve, reject) => {
            const crypto = require('crypto');
            let hmac = crypto.createHmac('sha256', 'U7nLQZty4r5XQJMDTzrHcGbn');
            hmac.update(details['payment[razorpay_order_id]'] + '|' + details['payment[razorpay_payment_id]'])
            hmac = hmac.digest('hex')
            if (hmac == details['payment[razorpay_signature]']) {
                resolve()
            } else {
                reject()
            }

        })
    },
    ChangePaymentStatus: (orderId) => {
        db.get().collection(collection.ORDER_COLLECTION)
            .updateOne({ _id: ObjectID(orderId) }, {
                $set: {

                    status: 'placed'
                }
            }).then(() => {
                resolve()
            })

    },
    SignUpReward: (ReffferalData,UserId) => {
        let ReferalId = ReffferalData.ReferalId
        return new Promise(async (resolve, reject) => {
            let usderDetails = await db.get().collection(collection.USERS_COLLECTION).findOne({referalId:ReferalId })
            let userdata = await db.get().collection(collection.USERS_COLLECTION).findOne({ _id: ObjectID(UserId) })


            let tractionhistory = {
                about: "credited 200 thruogh referal code",
                referdUSerdat: usderDetails.Name,
                Date: moment().format('MMMM Do YYYY, h:mm:ss a'),
                Amount: 200
            }

            let Tractionhistory = {
                about: "cedited 200 by using your referal code", 
                referdUSerdat: userdata.Name,
                Date: moment().format('MMMM Do YYYY, h:mm:ss a'),
                Amount: 100
            }


            if (usderDetails) {
                if (ReferalId === usderDetails.referalId) {
                    db.get().collection(collection.USERS_COLLECTION).updateOne({ _id: ObjectID(UserId) }, {
                        $inc: { WalletAmount: 200 },
                        $push: {
                            TransferDetails: tractionhistory
                        },
                        $set: {
                            RefRevard: false
                        }
                    }).then(() => {
                        resolve({ ok: true })
                    })
                    db.get().collection(collection.USERS_COLLECTION).updateOne({ referalId: ReferalId }, {
                        $inc: { WalletAmount: 100 },
                        $push: {
                            TransferDetails: Tractionhistory
                        }
                    }).then(() => {
                        resolve({ ok: true })
                    })
                }
            }
        })
    },
    editReferal:(userid)=>{
        console.log(userid,'>>>>>>>>>>>>>>>>>>>>');
     return new Promise((resolve,reject)=>{
        db.get().collection(collection.USERS_COLLECTION).updateOne({_id:ObjectID(userid)},{$set:{RefRevard:false}}).then(()=>{
            resolve(response)
        })
        
     })
    },
    getUserData: (userId) => {
        return new Promise((resolve, reject) => {
            let Userdata = db.get().collection(collection.USERS_COLLECTION).find({ _id: ObjectID(userId) }).toArray()
            resolve(Userdata)
        })
    },
    // applyCoupon: (totalAmount, Code, userId) => {
    //     return new Promise(async (resolve, reject) => {
    //         let CouponData = await db.get().collection(collection.OFFER_COLLECTION).findOne({ couponCode: Code })
    //         let final = totalAmount / 100 * CouponData.Persentage
    //         if (final <= CouponData.maxiAmount) {
    //             let FinalAmount = totalAmount - final
    //             resolve(FinalAmount)
    //         } else {
    //             let finalAmount = totalAmount - CouponData.maxiAmount
    //             resolve(finalAmount)
    //         }
    //     })
    // },
    applyCoupon: (totalAmount, Code, userId) => {
        console.log(Code, 'coupon code');
        let CurrentDate = new Date()
        console.log(CurrentDate, '?????????????????????????');
        return new Promise(async (resolve, reject) => {
            let Copndata = await db.get().collection(collection.OFFER_COLLECTION).findOne({ code: Code })       
            console.log(Copndata, 'cppdata vannu');
            let minAmount=Copndata.MiniumParchaseAmount
            if (Copndata){
                if(totalAmount>=minAmount){
                    let Expirydate = Copndata.ExpiryDate
                    if ( Copndata.startingDate <= CurrentDate && CurrentDate <= Expirydate){
                        let final = totalAmount / 100 * Copndata.Persantage   
                        if (final <= Copndata.MaximumEmount) {
                            let FinalAmount =Math.ceil(totalAmount - final)
                            resolve({FinalAmount,status:true})
                        } else {
                            let finalAmount = totalAmount - Copndata.MaximumEmount
                            resolve({finalAmount,ok:true})
                        }
                    }else{
                        console.log('copon expir');
                        resolve({expired:true})
                    }
                }else{
                    resolve({min:true,minAmount})
                }
             

            }else{
                console.log('invailed coupon code');
                resolve({invalied:true})
            }
        })
    },




    fetchCoupons: () => {
        return new Promise(async (resolve, reject) => {
            let coupons = await db.get().collection(collection.OFFER_COLLECTION).findOne()
            resolve(coupons)
        })
    },
    fetchData: (userId) => {
        return new Promise(async (resolve, recject) => {
            let Transferdata = await db.get().collection(collection.USERS_COLLECTION).aggregate([
                {
                    $match: { _id: ObjectID(userId) }
                },
                {
                    $unwind: '$TransferDetails'
                },
                {
                    $project: {
                        About: '$TransferDetails.about',
                        ReferdPersone: '$TransferDetails.referdUSerdat',
                        Date: '$TransferDetails.Date',
                        Amount: '$TransferDetails.Amount'
                    }
                }
            ]).toArray()
            resolve(Transferdata)
        })
    },
    FetchWalletAmount:(userid)=>{
       return new Promise(async(resolve,reject)=>{
        console.log(userid,'<<<<<<<<<<<<<< userid >>>>>>>>>>>>>>>>>>');
        let WaletAmount= await db.get().collection(collection.USERS_COLLECTION).findOne({_id:ObjectID(userid)})
        console.log(WaletAmount,">>>>>>>>>>>>>>>>>><<<<<<<<<<<<<<<<<");
        resolve(WaletAmount)
       })
    },
    verifyMobile:(MobileNumber)=>{
        console.log(MobileNumber,'Ividseyum vannu');
        return new Promise(async(resolve,reject)=>{
        let userInfo= await db.get().collection(collection.USERS_COLLECTION).findOne({Number:MobileNumber})
        console.log(userInfo,'//////about user/////');
        if(userInfo){
            if(userInfo.blocked == false){
                resolve({active:false})
            }else{
                resolve({status:true})
            }
        }else{
            resolve({status:false})
        }
        })
    },
    getdataByotp:(MobileNum)=>{
      return new Promise((resolve,reject)=>{
        let user=db.get().collection(collection.USERS_COLLECTION).findOne({Number:MobileNum})
        resolve(user)
      })  
    }

}
