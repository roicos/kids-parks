module.exports = function (express, app, path, bcrypt, dbClient) {

	app.use(express.static(path.join(__dirname, "../public")));

	/*function checkAuth(req, res, next){
		if (req.url === "/" && (!req.session || !req.session.authenticated)) {
			res.redirect("/login");
		} else {
			next();
		}
	}*/

	app.use(function(req, res, next) {
	  	res.locals.user = req.session.user;
	  	next();
	});

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

	app.post("/register", function (req, res, next) {

		dbClient.query("create table if not exists users(id serial primary key, login varchar(40) not null, password varchar(65) not null, name varchar(255), children varchar(255))", (err, result) => {

			if (err){
				console.log("Error create table: " + err);
				res.status(500).send({"error" : "Error create table: " + err});
			} else {
				var login = req.body.login.trim();
				var password1 = req.body.password1.trim();
				var password2 = req.body.password2.trim();
				var name = req.body.firstName.trim() + " " + req.body.lastName.trim();
				var children = req.body.children.trim();

				if(login !=""){
					dbClient.query("select id from users where login = '" + login + "'", (errSelect, resultSelect) => {
						if (errSelect){
							console.log("Error find user: " + errSelect);
							res.render("login", {"errorMessage" : "Error check if user exists."});
						} else {
							if(resultSelect.rows.length > 0){
								res.status(500).send({"error" : "This login is already exists."});
							} else {
								if(password1 == password2){ // ok
									bcrypt.hash(password1, 10, function(err, passHash) {
                                    	dbClient.query("insert into users (login, password, name, children) values ('"+ login + "', '"+ passHash + "', '"+ name + "', '"+ children +"') returning *", (errInsert, resultInsert) => {
											if (errInsert){
												console.log("Error insert user: " + errInsert);
											} else {
												req.session.user = resultInsert.rows[0]["id"];
												req.session.authenticated = true;
												res.status(200).send({"message" : "user registered: " + resultInsert.rows[0].id, "locals" : {"user" : resultInsert.rows[0].id}});
											}
										});
									});
								} else {
									res.status(500).send({"error" : "Passwords are not the same."});
								}
							}
						}
					});
				} else {
					res.status(500).send({"error" : "Login should not be empty."});
				}
			}
		});
	});


   	app.post("/login", function (req, res, next) {
   		var login = req.body.login ? req.body.login : "";
   		var password = req.body.password ? req.body.password : "";

   		if(login !=""){
			dbClient.query("select * from users where login = '" + login + "'", (err, result) => {
				if (err){
					res.status(500).send({"error" : "Error to find user in DB."});
				} else if(result.rows.length == 1) {
					var user = result.rows[0];
					bcrypt.compare(password, user.password, function(errBcrypt, resultBcrypt) {
						if(resultBcrypt) {
							req.session.user = user.id;
							req.session.authenticated = true;
							res.status(200).send({"message" : "user authorised: " + user.id, "locals" : {"user" : user.id}});
						} else {
							res.status(500).send({"error" : "Password is incorrenct."});
						}
					});
				} else {
					res.status(500).send({"error" : "Error to find one user."});
				}
			});
		} else {
			res.status(500).send({"error" : "Login should not be empty."});
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

    app.post("/rsvp", function (req, res, next) {
    	//var query = "drop table meetings";
    	var query = "create table if not exists meetings(id serial primary key, parkId varchar(255) not null, userID integer not null, date date not null, time time not null)";
		dbClient.query(query, (errCrTb, resultCrTb) => {
			if (errCrTb){
				console.log("Error create table: " + err);
				res.status(500).send({"error" : "Error create table: " + errCrTb});
			} else {
				var park = req.body.park.trim();
				var user = req.body.user.trim();
				var date = req.body.date.trim();
				var time = req.body.time.trim();

				if(date !="" && time !=""){
					dbClient.query("insert into meetings (parkId, userId, date, time) values ('"+ park + "', '"+ user + "', '"+ date + "', '"+ time +"') returning *", (errInsert, resultInsert) => {
						if (errInsert){
							console.log("Error insert meeting: " + errInsert);
						} else {
							res.status(200).send({"message" : "meeting registered: " + resultInsert.rows[0].id});
						}
					});
				} else {
					res.status(500).send({"error" : "Login should not be empty."});
				}
			}
		});
    });

   	app.get("*", function(req, res){
   		res.status(404).send("Can not find the page");
    });
}
