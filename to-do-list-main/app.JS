//jshint esversion:6
const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require('bcrypt');
const app = express();
const port = 5000;
var mysql = require('mysql');
const { query } = require("express");
var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'summer_project'
})

connection.connect(function(err) {
    if (err) throw err;
    console.log('connected..');
})


var items = [];
var current_user = null;
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
    extended: true
}))
app.use(express.static("public"));



app.get("/personal", function(req, res) {
    var today = new Date();
    var options = {
        weekday: "long",
        day: "numeric",
        month: "long"
    }
    var day = today.toLocaleDateString("en-US", options)
    // var listt=[];
    if(current_user!=null){
    connection.query("select * from todo where user_id='"+ current_user.uid +"'", function(err, result, feilds) {
        if (err) throw err
        // console.log(result[0]);
        // listt.push(result);
        res.render('list', {
            kindofday: day,
            newlistitems: items,
            tasks: result
        });
        
    })
    }
    else{
        res.redirect('/');
    }
    // console.log(listt);



});
// navigation requests
app.get("/home",function(req,res){
//   res.redirect('/personal');
 var today = new Date();
    var options = {
        weekday: "long",
        day: "numeric",
        month: "long"
    }
    var day = today.toLocaleDateString("en-US", options)
    connection.query("select * from todo where user_id='"+ current_user.uid +"'", function(err, result, feilds) {
        if (err) throw err
        // console.log(result);
        // listt.push(result);
        res.render('list', {
            kindofday: day,
            newlistitems: items,
            tasks: result
        });
    })
});
app.get("/active",function(req,res){
    var today = new Date();
    var options = {
        weekday: "long",
        day: "numeric",
        month: "long"
    }
    var day = today.toLocaleDateString("en-US", options)
     var active = "select * from todo where user_id='" + current_user.uid + "' and checked =0" ;
         connection.query(active, function(err, result, feilds) {
        if (err) throw err
        // console.log(result);
        // listt.push(result);
        res.render('filter', {
            kindofday: day,
            newlistitems: items,
            tasks: result
        });
})
});
app.get("/finished",function(req,res){
    var today = new Date();
    var options = {
        weekday: "long",
        day: "numeric",
        month: "long"
    }
    var day = today.toLocaleDateString("en-US", options)
     var active = "select * from todo where user_id='" + current_user.uid + "' and checked =1" ;
         connection.query(active, function(err, result, feilds) {
        if (err) throw err
        // console.log(result);
        // listt.push(result);
        res.render('filter', {
            kindofday: day,
            newlistitems: items,
            tasks: result
        });
})
});

app.get("/", function(req, res) {
    if(current_user!=null) res.redirect('/personal');
    res.render('login');
})
// console.log(listt);

//search*************************
app.post("/search", function(req, res) {
console.log(req.body.search);
    var today = new Date();
    var options = {
        weekday: "long",
        day: "numeric",
        month: "long"
    }
    var day = today.toLocaleDateString("en-US", options)
    var query="select * from todo where task like'"+req.body.search+"%' and user_id='"+current_user.uid+"'";
     connection.query(query, function(err, result, feilds) {
        if (err) throw err
        else {
            console.log("query ran successfully");
        }
        if (result.length == 0) {
            res.redirect('/home');
        }else{
          res.render('list', {
            kindofday: day,
            newlistitems: items,
            tasks: result
        });
        }
    })

});
//changepassword************************************
app.get("/changepassword", function(req, res) {
var today = new Date();
    var options = {
        weekday: "long",
        day: "numeric",
        month: "long"
    }
    var day = today.toLocaleDateString("en-US", options)
       res.render('changepassword', {
            kindofday: day,
           
        });
});
app.post("/change", function(req, res) {
    if(current_user==null){
        res.redirect("/");
    }
 if(bcrypt.compareSync(req.body.currentpassword, current_user.password)){
               console.log('confirm');
               var newpassword=req.body.newpassword;
               var confirmpassword=req.body.confirmpassword;
            var check=newpassword.localeCompare(confirmpassword);
            if(check==0){
                console.log('enter');
                var hashedPass = bcrypt.hashSync(req.body.newpassword, 10);
                  var sql = "update user set password='"+hashedPass+"' where uid='"+current_user.uid+"'";
            connection.query(sql, function(err, result, feild) {
                if (err) throw err
                console.log("data added successfully");
                res.redirect('/home');
            })
            }
            else{
                res.redirect('/changepassword')
            }
            }
            else{
                res.redirect('/changepassword')
            }
});

app.post("/personal", function(req, res) {
    console.log(current_user);
    var sql = "insert into todo values (null,'" + req.body.newitem + "',0, "+current_user.uid+")";
    connection.query(sql, function(err) {
        if (err) throw err
        console.log("data added successfully");
    })
    // connection.query("create table app(name varchar(20))")

    var item = req.body.newitem;
    items.push(item);
    res.redirect("/personal");
});

app.post("/register", function(req, res) {
  if (req.body.password != req.body.confirmpassword){
      res.redirect("/");
  }

  var sql = "select * from user where email='" + req.body.email + "'";
  connection.query(sql, function(err, result, feilds) {
        if (err) throw err;
        else{
            console.log("data shown successfully");
        }
        if (result.length == 0) {
            var hashedPass = bcrypt.hashSync(req.body.password, 10);
            var sql = "insert into user values (null,'" + req.body.email + "','" + hashedPass + "')";
            connection.query(sql, function(err, result, feild) {
                if (err) throw err
                console.log("data added successfully");
            })

            res.redirect("/personal");
        }else{

            res.redirect('/');
        }
    })
});


app.post("/login", function(req, res) {
    var sql = "select * from user where email='" + req.body.email + "'";

    connection.query(sql, function(err, result, feilds) {
        if (err) throw err
        else {
            console.log("data shown successfully");
        }
        if (result.length == 0) {
            res.redirect('/');
        }else{
            if(bcrypt.compareSync(req.body.password, result[0].password)){
                current_user = result[0];
                res.redirect('/personal');
            }
            else{
                res.redirect("/");
            }
        }
    })
});


app.get("/logout", function(req, res) {
    current_user = null;
    res.redirect('/');
});


app.get('/delete', function(req, res, next) {
    console.log(req.query);
         
    connection.query("select * from todo where id='" + req.query.delete_id + "'", function(err, results, feilds) {
        if (err) throw err;
        console.log("data deleted successfully");
        if(results[0].user_id==current_user.uid){
    connection.query("delete from todo where id='" + req.query.delete_id + "'", function(err, results, feilds) {
        if (err) throw err;
        console.log("data deleted successfully");
        console.log('DELETED rows:', results.affectedRows);
    });
}
    });
    res.redirect('/personal');
});



app.get('/update', function(req, res, next) {
        console.log(req.query);
        
    connection.query("select * from todo where id='" + req.query.update_id + "'", function(err, results, feilds) {
        if (err) throw err;
        console.log("data deleted successfully");
        if(results[0].user_id==current_user.uid){
             connection.query("update todo set checked=not checked where id='" + req.query.update_id + "'", function(err, results, feilds) {
        if (err) throw err
        console.log("data deleted successfully");
        console.log('DELETED rows:', results.affectedRows);
    });
        }
        console.log('DELETED rows:', results.affectedRows);
    });
    console.log(req.query);
    res.redirect('/personal');
});

app.listen(port, function() {
    console.log("Server started on port.");
    console.log(`Example app listening at http://localhost:${port}`);
});