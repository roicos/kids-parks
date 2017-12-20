module.exports = function (express, app, path, bcrypt) {

	app.use(express.static(path.join(__dirname, "../public")));

	/*function checkAuth(req, res, next){
		if (req.url === "/" && (!req.session || !req.session.authenticated)) {
			res.redirect("/login");
		} else {
			next();
		}
	}*/

	app.get("/", /*checkAuth,*/ function (req, res, next) {
    		res.render("index");
    });

    app.post("/search", function(req, res, next){
    	var location = req.body.location.trim().toLowerCase();
    	var result = location + "request ricieved";


    	const yelp = require("yelp-fusion");
        const apiKey = "oYLw4WA_Dd72EDyi2Apq8XpKmrW8XQvYDNbtuB7e12Ho53CXPXEBbf-vt9Skdw-bThn7zLQI4Z-unRYbFM1wO38ATpX-EM3Khq9wOGoeIHzRW_nRhB9zEAKJ0PU6WnYx";

        const searchRequest = {
          term: "Parks for Kids",
          location: location
        };

        const client = yelp.client(apiKey);

        client.search(searchRequest).then(response => {
          const searchResult = response.jsonBody.businesses;
          const jsonResult = JSON.stringify(searchResult, null, 4);
          res.status(200).send(jsonResult);
        }).catch(e => {
          console.log(e);
        });
    });

	app.get("/login", function (req, res, next) {
    	res.render("login", {"errorMessage" : ""});
   	});

   	app.post("/login", function (req, res, next) {

   		var userName = "User";
   		var hash = "passwordHashByBcrypr";

   		var login = req.body.login ? req.body.login : "";
   		var password = req.body.password ? req.body.password : "";

		if(login === userName){
			bcrypt.compare(password, hash, function(err, result) {
				if(result) {
					req.session.authenticated = true;
					res.redirect("/");
				} else {
					res.render("login", {"errorMessage" : "Password is incorrect."});
				}
			});
		} else {
			res.render("login", {"errorMessage" : "Login is incorrect."});
		}
    });

    app.get("/logout", function (req, res, next) {
		if (req.session) {
			req.session.destroy(function(err) {
				if(err) {
					return next(err);
				} else {
					return res.redirect("/");
				}
			});
		}
    });

   	app.get("*", function(req, res){
   		res.status(404).send("Can not find the page");
    });
}
