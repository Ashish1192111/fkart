const express = require("express");
let passport = require("passport");
let jwt = require("jsonwebtoken");
let JWTStrategy = require("passport-jwt").Strategy;
let ExtractJWT = require("passport-jwt").ExtractJwt;
const { mobiles, pincodes, reviews,users,carts,wishlist } = require("./data")


const app = express();
app.use(express.json());

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept, authorization"
    );
    res.header("Access-Control-Allow-Methods", "GET,POST,DELETE,PUT,OPTIONS,HEAD,PATCH");
    next();
});

app.use(passport.initialize());

let port = process.env.PORT || 2410;
app.listen(port, () => console.log(`Server Started on port ${port}!`));

const params = {
    jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
    secretOrKey: "jwsecret2738692"
}

const jwtExpirySeconds = 1000;

let strategy = new JWTStrategy(params, function (token, done) {
    console.log("In JWT Strategy", token);

    let user = users.find(u => u.email === token.user);
    console.log("User ", user);
    if (!user) {
        return done(null, false, { message: "Incorrect Email & Password" })
    }
    else {
        return done(null, user)
    }
})


passport.use("All", strategy)

app.post("/login", function (req, res) {
    let { email, password } = req.body;
    let user = users.find(u => u.email === email && u.password === password);
    console.log(user)
    if (user) {
        let payload = { user: user.email };
        let token = jwt.sign(payload, params.secretOrKey, {
            algorithm: "HS256",
            expiresIn: jwtExpirySeconds
        })
        res.send({ token: "bearer " + token , user : user });
    }
    else {
        res.status(404).send("Invalid credentials")
    }

});

app.get("/getAllData", function (req, res) {
    res.send(mobiles)
})



app.get("/products/:category/:brand", function (req, res) {
    try {
        const { category, brand } = req.params;
        const { page, assured, ram, rating, price, sort } = req.query
        console.log(sort)

        let filterMobiles = mobiles;

        if (category) {
            filterMobiles = filterMobiles.filter((m) => m.category === category);
        }

        if (brand) {
            filterMobiles = filterMobiles.filter((m) => m.brand === brand);
        }
        if (assured) {
            filterMobiles = filterMobiles.filter((m) => m.assured);
        }
        if (sort === "popularity")
            filterMobiles.sort((m1, m2) => m2.popularity - m1.popularity)
        if (sort === "desc")
            filterMobiles.sort((m1, m2) => m2.price - m1.price)
        if (sort === "asc")
            filterMobiles.sort((m1, m2) => m1.price - m2.price)

        if (ram) {
            const ramValues = ram.split(",").map(val => {
                const operator = val.slice(0, 2);
                const amount = parseInt(val.slice(2));
                return { operator, amount };
            });


            filterMobiles = filterMobiles.filter(mobile => {
                return ramValues.find(({ operator, amount }) => {
                    if (operator === '<=' && mobile.ram <= amount) {
                        return true;
                    } else if (operator === '>=' && mobile.ram >= amount) {
                        return true;
                    }
                    return false;
                });
            });
        }
        if (rating) {
            const ratingValues = rating.split(",").map(val => {
                const operator = val.slice(0, 1);
                const amount = +(val.slice(1))
                return { operator, amount }
            });
            console.log(ratingValues)

            filterMobiles = filterMobiles.filter(mobile => {
                return ratingValues.find(({ operator, amount }) => {
                    if (operator === ">" && mobile.rating > amount) {
                        return true
                    }
                    return false;
                });
            });
        }
        if (price) {
            const priceValues = price.split(",").map(priceRange => {
                const [minPrice, maxPrice] = priceRange.split("-").map(Number);
                return { minPrice, maxPrice };
            });
            filterMobiles = filterMobiles.filter(mobile => {
                return priceValues.find(({ minPrice, maxPrice }) => {
                    return mobile.price >= minPrice && mobile.price <= maxPrice;
                });
            });
        }
        const paginatedMobiles = paginate(filterMobiles, page);
        console.log(paginatedMobiles.length)
        const totalPages = Math.ceil(filterMobiles.length / 4); 
        

        res.send({
            page: page,
            totalpage : totalPages,
            items: paginatedMobiles,
            totalItems: paginatedMobiles.length,
            totalNum: filterMobiles.length,
        });

    } catch (error) {
        res.status(500).send({ error: error.message });
    }

})

app.get("/fkart/products/:category", function (req, res) {
    try {

        const { category } = req.params;
        const { q, page,assured, ram, rating, price, sort } = req.query
        let filterMobiles = mobiles;
        if (q) {
            filterMobiles = filterMobiles.filter(mobile =>
                mobile.name.toLowerCase().includes(q.toLowerCase())
            );
        }

        if (category) {
            filterMobiles = filterMobiles.filter((m) => m.category === category);
        }

       
        if (assured) {
            filterMobiles = filterMobiles.filter((m) => m.assured);
        }
        if (sort === "popularity")
            filterMobiles.sort((m1, m2) => m2.popularity - m1.popularity)
        if (sort === "desc")
            filterMobiles.sort((m1, m2) => m2.price - m1.price)
        if (sort === "asc")
            filterMobiles.sort((m1, m2) => m1.price - m2.price)

            if (ram) {
                const ramValues = ram.split(",").map(val => {
                    const operator = val.slice(0, 2);
                    const amount = parseInt(val.slice(2));
                    return { operator, amount };
                });
    
    
                filterMobiles = filterMobiles.filter(mobile => {
                    return ramValues.find(({ operator, amount }) => {
                        if (operator === '<=' && mobile.ram <= amount) {
                            return true;
                        } else if (operator === '>=' && mobile.ram >= amount) {
                            return true;
                        }
                        return false;
                    });
                });
            }
            if (rating) {
                const ratingValues = rating.split(",").map(val => {
                    const operator = val.slice(0, 1);
                    const amount = +(val.slice(1))
                    return { operator, amount }
                });
                console.log(ratingValues)
    
                filterMobiles = filterMobiles.filter(mobile => {
                    return ratingValues.find(({ operator, amount }) => {
                        if (operator === ">" && mobile.rating > amount) {
                            return true
                        }
                        return false;
                    });
                });
            }
            if (price) {
                const priceValues = price.split(",").map(priceRange => {
                    const [minPrice, maxPrice] = priceRange.split("-").map(Number);
                    return { minPrice, maxPrice };
                });
                filterMobiles = filterMobiles.filter(mobile => {
                    return priceValues.find(({ minPrice, maxPrice }) => {
                        return mobile.price >= minPrice && mobile.price <= maxPrice;
                    });
                });
            }

          const paginatedMobiles = paginate(filterMobiles, page);
          console.log(paginatedMobiles.length)
          const totalPages = Math.ceil(filterMobiles.length / 4); 

          res.send({
              page: page,
              totalpage : totalPages,
              items: paginatedMobiles,
              totalItems: paginatedMobiles.length,
              totalNum: filterMobiles.length,
          });
       
    }
    catch (error) {
        res.status(404).send({ error: error.message })
    }
})


app.get("/deals", function (req, res) {
    const randomMobiles = getRandomNumbers(mobiles, 16);
    res.send(randomMobiles)

})


// Task 1.2 API

app.get("/products/:productid", function (req, res) {
    const { productid } = req.params;

    try {
        let findProduct = mobiles.find((m) => m.id === productid)
        if (findProduct) {
            res.send(findProduct)
        }
        else {
            throw new Error(`No product found of that ${productid}`);
        }
    }
    catch (error) {
        res.status(500).send({ error: error.message });
    }
})


app.post("/addToCarts", function(req,res){
    let body = req.body;
   
  
    let json = {
        cartId : carts.length + 1,
        quantity : 1,
        ...body
    }
    carts.push(json)
    res.send(json)
  })

  app.get("/getCart", function(req,res){
    res.send(carts)
  })


  app.put("/updateQuantity/:cartId", function(req,res){
    let body = req.body
    let cartId = +req.params.cartId
    const cartItem = carts.find((item) => item.cartId === cartId);
    if (cartItem) {
      cartItem.quantity = (cartItem.quantity || 0) + body.quantity;
      if (cartItem.quantity <= 0) {
        carts.splice(carts.indexOf(cartItem), 1);
    }
    res.send("quantity Updated")
    }
  } )


  app.delete("/removeCart/:cartId", function(req,res){
    let cartId = +req.params.cartId;
    let findIndex = carts.findIndex((c) => c.cartId === cartId );
    console.log(findIndex)
    if(findIndex >= 0)
    {
        let product = carts.splice(findIndex, 1);
        res.send(product);
    }
  })
  

app.get("/pincode/:pincode/:productId", function (req, res) {
    try {
        const { pincode, productId } = req.params;
        const foundPincode = pincodes.find((p) => p.pincode === +pincode);
        if (!foundPincode) {
            return res.status(404).send({ error: `Not Availabe at ${pincode}` });
        }

        const foundProduct = foundPincode.mobileList.find((m) => m.id === productId);
        if (!foundProduct) {
            return res.status(404).send({ error: `Item is not available on this ${pincode}` });
        }

        res.send(foundProduct);
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
})



app.get("/reviews/:productId", function (req, res) {
    try {
        const { productId } = req.params;
        let findReview = reviews.find((r) => r.mobileId === productId)

        if (findReview) {
            res.send(findReview)
        }
        else {
            res.status(404).send({ error: `No review found of this ${productId}` })
        }
    }

    catch (error) {
        res.status(500).send({ error: error.message })
    }
})



app.post("/postWishlist/:userid", function(req, res) {
    let userid = +req.params.userid;
    let product = req.body;
    let findUserIndex = wishlist.findIndex((w) => w.userid === userid);

    if (findUserIndex !== -1) {
      
        wishlist[findUserIndex].wishlists.push(product);
        res.send(wishlist[findUserIndex]);
    } else {
       
        let newUser = { userid: userid, wishlists: [product] };
        wishlist.push(newUser);
        res.send(newUser);
    }
});


app.delete("/removeWishlist/:userId/:mobId", function(req, res) {
    let userId = +req.params.userId;
    let mobId = req.params.mobId;
 
   
    let userIndex = wishlist.findIndex((user) => user.userid === userId);

    if (userIndex !== -1) {
        let userWishlist = wishlist[userIndex].wishlists;

       
        let mobileIndex = userWishlist.findIndex((item) => item.id === mobId);
        console.log(mobileIndex)

        if (mobileIndex !== -1) {
           
            userWishlist.splice(mobileIndex, 1);
            res.send("Product is removed");
        } else {
            res.status(404).json({ message: "Mobile item not found in the wishlist." });
        }
    } else {
        res.status(404).json({ message: "User not found in the wishlist." });
    }
});


app.get("/getWishlist", function(req,res){
    res.send(wishlist)
})


function paginate(arr, page) {
    const perPage = 4;
    const startIndex = (page - 1) * perPage;
    const endIndex = startIndex + perPage;
    return arr.slice(startIndex, endIndex);
}



function getRandomNumbers(arr, count) {
    const result = [];


    while (result.length < count) {
        const randomIndex = Math.floor(Math.random() * arr.length);
        if (!result.includes(arr[randomIndex])) {
            result.push(arr[randomIndex]);
        }
    }

    return result;
}