const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const _ = require("lodash");

const mongoose = require("mongoose");
mongoose.set("strictQuery", false);

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

//database
mongoose
  .connect(
    "mongodb+srv://mrBlue:01mrBlue@cluster0.awqttsa.mongodb.net/todolistDB"
  )
  .then(() => console.log("database connection success"))
  .catch((err) => console.log(err));

const itemsSchema = new mongoose.Schema({ name: String });

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your todolist!",
});
const item2 = new Item({
  name: "Hit the + button to add a new item.",
});
const item3 = new Item({
  name: "<-- Hit this to delete an item.",
});

const defaultItems = [item1, item2, item3];

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema],
});

const List = mongoose.model("List", listSchema);

//getting home route
app.get("/", (req, res) => {
  Item.find({}, (err, foundItems) => {
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, (err) => {
        if (err) console.log(err);
        else console.log("inserted Default successfully");
      });
      res.redirect("/");
    } else {
      res.render("list", {
        listTitle: "Today",
        newListItems: foundItems,
      });
    }
  });
});

//post route for home
app.post("/", (req, res) => {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  if (itemName.length != 0) {
    const item = new Item({
      name: itemName,
    });

    if (listName === "Today") {
      item.save();
      res.redirect("/");
    } else {
      List.findOne({ name: listName }, (err, foundList) => {
        foundList.items.push(item);
        foundList.save();
        res.redirect("/" + listName);
      });
    }
  }
});

//delete post
app.post("/delete", (req, res) => {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, (err) => {
      if (!err) {
        console.log("deleted");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItemId } } },
      (err, foundList) => {
        if (!err) {
          res.redirect("/" + listName);
        }
      }
    );
  }
});

//dynamic page routes

app.get("/:customListName", (req, res) => {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName }, (err, foundList) => {
    if (!err) {
      if (!foundList) {
        //create new list
        const list = new List({
          name: customListName,
          items: defaultItems,
        });
        list.save();
        res.redirect("/" + customListName);
      } else {
        //  show existing list
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items,
        });
      }
    }
  });
});

app.listen(process.env.PORT || 3000, () => {
  console.log("running on port 3000!");
});
