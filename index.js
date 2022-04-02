const Joi = require("joi");
const express = require("express");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");
const app = express();

// Middleware
app.use(express.json());

app.get("/owners", async (req, res) => {
  try {
    const data = JSON.parse(await fs.readFileSync("db.json"));
    res.status(200).json(data.owners);
  } catch (error) {
    res.status(500).send(error);
  }
});
app.get("/api/owners/:id", async (req, res) => {
  try {
    const data = JSON.parse(await fs.readFileSync("db.json"));
    let owners = data.owners;
    owners = owners.find((c) => c.id === req.params.id);
    if (!owners)
      res.status(404).send("the owners with the given ID was not found");
    res.send(owners);
  } catch (error) {
    res.status(500).send(error);
  }
});

app.post("/api/owners", async (req, res) => {
  try {
    const data = JSON.parse(await fs.readFileSync("db.json"));
    const schema = Joi.object({
      name: Joi.string().min(3).required(),
      email: Joi.string().min(3).required(),
      address: Joi.string().min(3).required(),
    });

    const result = schema.validate(req.body);
    console.log(result);

    if (result.error) {
      res.status(400).send(result.error.details[0].message);
    }

    const newOwner = {
      name: req.body.name,
      address: req.body.address,
      email: req.body.email,
      id: uuidv4(),
    };
    const newData = {
      ...data,
      owners: [...data.owners, newOwner],
    };

    fs.writeFile("db.json", JSON.stringify(newData), (err) => {
      if (err) res.status(500).send("An error when trying to save new data");
      res.status(201).send(newOwner);
    });
  } catch (error) {
    res.status(500).send(error);
  }
});
app.put("/api/owners/:id", async (req, res) => {
  try {
    const data = JSON.parse(await fs.readFileSync("db.json"));
    const owners = data.owners;
    const owner = owners.find((c) => c.id === req.params.id);

    if (!owner)
      res.status(404).send("the owners with the given ID was not found");

    if (req.body.email) owner.email = req.body.email;
    if (req.body.name) owner.name = req.body.name;
    if (req.body.address) owner.address = req.body.address;

    const newData = {
      ...data,
      owners: [...owners.filter((c) => c.id !== req.params.id), owner],
    };
    fs.writeFile("db.json", JSON.stringify(newData), (err) => {
      if (err) res.status(500).send("An error when trying to save new data");
      res.status(201).send(owner);
    });
  } catch (error) {
    res.status(500).send(error);
  }
});

app.delete("/api/owners/:id", async (req, res) => {
  try {
    const data = JSON.parse(await fs.readFileSync("db.json"));
    const owners = data.owners;
    const owner = owners.find((c) => c.id === req.params.id);
    if (!owner)
      res.status(404).send("the owners with the given ID was not found");

    const newData = {
      ...data,
      owners: [...data.owners.filter((c) => c.id !== req.params.id)],
    };
    fs.writeFile("db.json", JSON.stringify(newData), (err) => {
      if (err) res.status(500).send("An error when trying to save new data");
      res.status(200).send("owner deleted");
    });
  } catch (error) {
    res.status(500).send(error);
  }
});

app.listen(8080, () => {
  console.log("Serveur à l'écoute");
});

module.exports = app;
