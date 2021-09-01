//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const _ = require("lodash");

const date = require(__dirname + "/date.js");


// Mongoose
const mongoose = require("mongoose");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
// app.use(express.static("public"));

app.use(express.static(__dirname + '/public'));


// : / ? # [ ] @ these characters must be changed to "percent encoding" other wise ther would be a lot of warnings 
// use the website "uri encoder"
mongoose.connect("mongodb+srv://Kaizoku:123%21%40%23qweQWE@todolist.rti3a.mongodb.net/todolistDB", { useNewUrlParser: true });

const itemsSchema = {
  name: String
};

// model(collectionName, schema);
const Item = mongoose.model("Items", itemsSchema);

// list schema to create our own custom lists
const listSchema = {
  name: String,
  items: [itemsSchema]
}

const List = mongoose.model("List", listSchema); 

app.get("/", function(req, res) {

  const day = date.getDate();
  let customLists = [];

  List.find({}, function(err, listFound) {
    if (err) {
      console.log(err);
    } else {
      if(listFound.length === 0) {
        
      } else {
        customLists = listFound;
      }
    }
  });

  Item.find({}, function (err, itemsFound) {
    if (err) {
      console.log(err);
    } else {
      res.render("list", {
        listTitle: day, 
        newListItems: itemsFound,
        customLists: customLists
      });
    }
  });

});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;
  
  const day = date.getDate();


  const newItem = new Item({
    name: itemName
  });

  if(listName === day) {
    
    newItem.save();
    
    // this will reload the page and then we would have filled our db with the new elements
    res.redirect("/");
  } else {

    // if custom list

    List.findOne({name: listName}, function (err, found) {
      if(err) {
        console.log(err);
      } else {
        found.items.push(newItem);
        found.save();

        res.redirect("/list/"+listName);
      }
    })
  }
});

// express route parameters
// Custom lists get
app.get("/list/:listName", function(req,res){

  let listTitle = _.capitalize(req.params.listName);


  List.findOne({name: listTitle}, function (err, found) {
    if (err) {
      console.log(err);
    } else {
      if (!found) {
        const list = new List({
          name: listTitle,
        });
      
        list.save();

        // the below line is redirecting us back to this route and this time we enter the else block
        res.redirect("/list/" + listTitle);
      } else {
        
        res.render("customList", {
          listTitle: found.name,
          newListItems: found.items
        });
      }
    }
  });
});

app.get("/about", function(req, res){
  res.render("about");
});

app.post("/delete", function (req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  const today = date.getDate();

  if (listName === today) {
    Item.findByIdAndRemove(checkedItemId, function (err) {
      if (err) {
        console.log(err);
      } else {
        res.redirect("/");
      }
    });
  } else {
    
    // we are using update and not delete because we want to delete an element that is inside the items element in the schema
    List.findOneAndUpdate(
      {name: listName},
      {$pull: {items: {_id: checkedItemId}}},
      function (err, found) {
        
        if (!err) {
          res.redirect("/list/" + listName);
        }
      }
    )};
});

// new list
app.post("/list", function (req, res) {
  const listName = _.capitalize(req.body.chooseList);

  if(listName) {
    res.redirect("/list/" + listName);
  } else {
    res.redirect("/");
  }
});

app.post("/delete-list", function (req, res) {
  const listName = _.capitalize(req.body.list);

  List.deleteOne({name: listName}, function (err) {
    if(err) {
      console.log(err);
    } else {
      res.redirect("/");
    }
  });
})

app.listen(3000, function() {
  console.log("Server started on port 3000");
});