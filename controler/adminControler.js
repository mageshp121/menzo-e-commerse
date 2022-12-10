var express = require('express');
const { Db } = require('mongodb');
const { response } = require('../app');
var router = express.Router();
var productHelperse = require('../helperse/productHelperse');
const { verifyMobile } = require('../helperse/userHelperse');
const userHelperse = require('../helperse/userHelperse');

const preadminmail = "magesh@gmail.com"
const prepss = "1122"




/*....................................Product-Mangement-Page........................................*/




let ProductPage = async (req, res) => {
    productHelperse.getAllProduct().then((products) => {
       res.render('admin/product-manage', { admin: true, layout: 'admin', products })
    }).catch((error)=>{
       res.render('admin/error')
    })
 
 }



/*...................................................................................................*/
/*......................................Add-Product-Page.............................................*/




let AddProductPage=(req, res) => {
    productHelperse.getAllCategory().then((ctdata) => {
       res.render('admin/add-product', { admin: true, layout: 'admin', ctdata })
    }).catch((error)=>{
       res.render('amdin/error')
    })
 }


/*.....................................................................................................*/
/*...........................................Add-Products-Post..........................................*/




let AddProduct=(req, res) =>{
    req.body.price = parseInt(req.body.price)
    productHelperse.getAllCategory().then((ctdata) => {
        console.log(ctdata,'//////?????????????????mzxnbchjgshdghysd');
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
    }).catch((error)=>{
     res.render('admin/error')
    })
 }


/*......................................................................................................*/
/*...........................................Delete-Product.............................................*/
 let DeleteProduct=(req, res) => {
    var prId = req.params.id
    productHelperse.deleteProduct(prId).then((response) => {
       res.redirect('/admin/product-manage')
    }).catch((error)=>{
       res.render('admin/error')
    })
 
 }
/*......................................................................................................*/
 /*...........................................Category-manage-page.......................................*/

 let GetAllCategory=(req, res) => {
    productHelperse.getAllCategory().then((ctdata) => {
       res.render('admin/category-manage', { admin: true, layout: 'admin', ctdata, productExist: req.session.productExist })
       req.session.productExist = null
    }).catch((error)=>{
        res.render('admin/error')
    })
 }



 /*......................................................................................................*/
 /*...........................................Add-Category-page...........................................*/

let AddCategoryPage=(req,res)=>{
    try{
    res.render('admin/add-category',{admin: true, layout: 'admin'})
    }catch(eror){
       res.render('admin/error')
    }
}
 /*......................................................................................................*/
/*...........................................Add-Category-Post............................................*/


let AddCategory=(req, res) => {
    let add = req.body
    console.log(add,'////////////???????????Agsyagsagaga');
    productHelperse.insertCategory(add).then((response) => {
       if (response.message) {
          req.session.CateEXIst = "Category added"
          res.json({ok:true})
       } else {
          req.session.CateEXIst = "Soryy Category alreadyexist"
          res.json({ok:false})
       }
    }).catch((error)=>{
       res.render('admin/error')
    })
 
 
 }
/*......................................................................................................*/
/*...........................................Delete-Category-Post........................................*/

let DeleteCtegory = (req, res) =>{
    let ctId = req.params.categoryName
    productHelperse.deletCategory(ctId).then((response)=> {
       if (response.message) {
          req.session.productExist = "Category is not empty, cannot performe delete"
          res.redirect('/admin/category-manage')
       } else {
          res.redirect('/admin/category-manage')
       }
    }).catch((error)=>{
       res.render('admin/error')
    })

 }
 /*......................................................................................................*/
 /*.............................................Edite-products...........................................*/
let EditeProduct = async (req, res) => {
    let Details = req.query.id
    await productHelperse.getProductdetails(Details).then((products)=>{
    res.render('admin/edite-product', { admin: true, layout: 'admin', products })
    }).catch((eror)=>{
       let error={}
       error.massage='something went wrong'
       res.render('aamin/error',{message:error.massage})
    })
 }





 module.exports={
    ProductPage,
    AddProduct,
    GetAllCategory,
    AddProductPage,
    AddCategoryPage,
    AddCategory,
    DeleteCtegory,
    DeleteProduct,
    EditeProduct
   

 }