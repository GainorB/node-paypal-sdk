require('dotenv').config();
const express = require('express');
const path = require('path');
const paypal = require('paypal-rest-sdk');

const { PAYPAL_CLIENTID, PAYPAL_SECRET } = process.env;

// CONFIGURE SDK
paypal.configure({
  mode: 'sandbox', //sandbox or live
  client_id: PAYPAL_CLIENTID,
  client_secret: PAYPAL_SECRET
});

// INITIALIZE APP
const app = express();

// VIEW ENGINE SETUP
app.set('view engine', 'ejs');

// INDEX ROUTE
app.get('/', (req, res) => {
  res.render('index');
});

app.post('/pay', (req, res) => {
  const create_payment_json = {
    intent: 'sale',
    payer: {
      payment_method: 'paypal'
    },
    // REDIRECT URLS FOR HANDLING THE TRANSACTION
    redirect_urls: {
      return_url: 'http://localhost:3000/success',
      cancel_url: 'http://localhost:3000/cancel'
    },
    // AN ARRAY OF OBJECTS REPRESENTING EACH ITEM IN THE TRANSACTION
    transactions: [
      {
        item_list: {
          items: [
            {
              name: 'Yeezy Boost Turtle Dove',
              sku: '001',
              price: '200.00',
              currency: 'USD',
              quantity: 1
            }
          ]
        },
        amount: {
          currency: 'USD',
          total: '200.00'
        },
        description: 'OG Yeezies.'
      }
    ]
  };

  // CREATE THE PAYPAL TRANSACTION
  paypal.payment.create(create_payment_json, function(error, payment) {
    if (error) {
      throw error;
    } else {
      // LOOK THROUGH LINKS ARRAY TO GET THE LINK TO REDIRECT TO PAYPAL FOR PROCESSING
      for (let i = 0; i < payment.links.length; i++) {
        if (payment.links[i].rel === 'approval_url') {
          // REDIRECTS TO THE APPROVAL_URL
          res.redirect(payment.links[i].href);
        }
      }
    }
  });
});

// IF TRANSACTION IS SUCCESSFULL, REDIRECT HERE
app.get('/success', (req, res) => {
  // EXTRACT QUERY PARAMENTERS FROM REDIRECT URL
  const payerId = req.query.PayerID;
  const paymentId = req.query.paymentId;

  const execute_payment_json = {
    payer_id: payerId,
    transactions: [
      // AN OBJECT REPRESENTING THE TOTAL OF THE TRANSACTION
      {
        amount: {
          currency: 'USD',
          total: '200.00'
        }
      }
    ]
  };

  // EXECUTE PAYMENT
  paypal.payment.execute(paymentId, execute_payment_json, function(error, payment) {
    if (error) {
      console.log(error.response);
      throw error;
    } else {
      // WILL SHOW THE COMPLETED TRANSACTION DATA
      console.log(JSON.stringify(payment));
      res.send('Success');
    }
  });
});

// CANCEL TRANSACTION REDIRECT
app.get('/cancel', (req, res) => res.send('Cancelled Transaction'));

// STARTING SERVER
const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
