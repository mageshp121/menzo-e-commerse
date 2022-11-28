
const { response } = require("../../app")
function addToCart(productId) {
  $.ajax(
    {
      url: '/add-to-cart/' + productId,
      methode: 'get',
      success: (response) => {
        if (response.status) {
          alertify.set('notifier', 'position', 'top-center');
          alertify.success('product added ');
          let count = $('#cart-count').html()
          count = parseInt(count) + 1
          $("#cart-count").html(count)
        } else {
          location.href = '/userlogin'
        }
      }
    }
  )
}


function changeQuantity(cartId, productDetailsId, userId, count) {
  console.log(cartId, productDetailsId, count, userId, 'params')
  let quantity = parseInt(document.getElementById(productDetailsId).innerHTML)
  count = parseInt(count)
  $.ajax({
    url: '/change-product-quantity',
    data: {
      user: userId,
      cart: cartId,
      productDetails: productDetailsId,
      count: count,
      quantity: quantity
    },
    method: 'post',
    success: (response) => {
      if (response.removeProduct) {
        alertify.alert( 'ALERT','Are sure ', function(){ location.reload() })
      } else {
        document.getElementById(productDetailsId).innerHTML = quantity + count
        document.getElementById('emount').innerHTML = response.Total
      }
    }
  })
}


function RemoveFromCart(cartId, productDetailsId) {
  console.log("jaijavan")
  $.ajax({
    url: '/Remove-from-Cart',
    data: {
      cart: cartId,
      productDetails: productDetailsId
    },
    method: 'post',
    success: (response) => {
      location.reload()
    }

  })
}

function removeAdress(uid, userId) {
  $.ajax({
    url: '/address-remove',
    data: {
      adressId: uid,
      userId: userId
    },
    method: 'post',
    success: (response) => {
      location.reload()
    }
  })
}

function removeFromwishlist(wishlistId, wishProductId) {
  $.ajax({
    url: '/remove-from-wishlist',
    data: {
      wishlist: wishlistId,
      wishProducts: wishProductId
    },
    method: 'post',
    success: (response) => {
      location.reload()
    }
  })
}