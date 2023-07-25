const OFFERS = [
  {
    id: 1,
    title: "One time offer",
    productTitle: "The S-Series Snowboard",
    productImageURL:
      "https://cdn.shopify.com/s/files/1/0", // Replace this with product image's URL.
    productDescription: ["This PREMIUM snowboard is so SUPER DUPER awesome!"],
    originalPrice: "699.95",
    discountedPrice: "699.95",
    changes: [
      {
        type: "add_variant",
        variantID: 123456789, // Replace with the variant ID.
        quantity: 1,
        discount: {
          value: 15,
          valueType: "percentage",
          title: "15% off",
        },
      },
    ],
  },
];

/*
 * For testing purposes, product information is hardcoded.
 * In a production application, replace this function with logic to determine
 * what product to offer to the customer.
 */
function getOffers() {
  return OFFERS;
}

/*
 * Retrieve discount information for the specific order on the backend instead of relying
 * on the discount information that is sent from the frontend.
 * This is to ensure that the discount information is not tampered with.
 */
function getSelectedOffer(offerId) {
  return OFFERS.find((offer) => offer.id === offerId);
}

/*
 * You don't have an active session from Shopify App Bridge, so you need to define this route before the
 * session validation middleware.
 * Add cors middleware to allow the request to come from Shopify checkout.
 */
app.post("/api/offer", cors(), async (req, res) => {
  try {
    // JWT verify will throw an error if this token doesn't have a valid signature. For more information, refer to
    // https://github.com/auth0/node-jsonwebtoken#jwtverifytoken-secretorpublickey-options-callback
    jwt.verify(req.body.token, process.env.SHOPIFY_API_SECRET);
  } catch (e) {
    res.status(401).send("Unauthorized");
  }

  const payload = getOffers();
  res.json(JSON.stringify({offers: payload}));
});

/*
* The extension will call this route with information about how the order should be changed.
* You will create a JWT token that is signed with the app's API secret key.
* The extension will call Shopify with the token to update the order.
*/
app.post("/api/sign-changeset", cors(), async (req, res) => {
  try {
    jwt.verify(req.body.token, process.env.SHOPIFY_API_SECRET);
  } catch (e) {
    res.status(401).send("Unauthorized");
  }

  const selectedOffer = getSelectedOffer(req.body.changes);

  const payload = {
    iss: process.env.SHOPIFY_API_KEY,
    jti: uuidv4(),
    iat: Date.now(),
    sub: req.body.referenceId,
    changes: selectedOffer.changes,
  };

  const token = jwt.sign(payload, process.env.SHOPIFY_API_SECRET);
  res.status(200).send(JSON.stringify({token}));
});
