const Joi = require("joi");
const dotenv = require("dotenv");
const express = require("express");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");
const bcrypt = require("bcrypt");
const { generateAccessToken } = require("./generateToken");
const { authenticateToken } = require("./authentification");
dotenv.config();

const app = express();

const router = express.Router();
// Middleware
app.use(express.json());
router.post("/api/connect", async (req, res) => {
  const schema = Joi.object({
    email: Joi.string().min(3).required(),
    password: Joi.string().min(6).required(),
  });

  const result = schema.validate(req.body);

  if (result.error) {
    res.status(400).send(result.error.details[0].message);
  }

  const data = JSON.parse(await fs.readFileSync("db.json"));
  const isExist = data.owners.find((o) => o.email === req.body.email);
  if (!isExist) res.status(400).send("Email is not exist");
  const valid = await bcrypt.compare(req.body.password, isExist?.password);
  if (!valid) res.status(400).send("Email or password not valid");
  const token = await generateAccessToken(req.body.email);

  res
    .status(200)
    .json({
      email: isExist.email,
      name: isExist.name,
      address: isExist.password,
      token,
    });
});
router.post("/api/signup", async (req, res) => {
  try {
    const data = JSON.parse(await fs.readFileSync("db.json"));
    const schema = Joi.object({
      name: Joi.string().min(3).required(),
      email: Joi.string().min(3).required(),
      address: Joi.string().min(3).required(),
      password: Joi.string().min(6).required(),
    });

    const result = schema.validate(req.body);
    console.log(result);

    if (result.error) {
      res.status(400).send(result.error.details[0].message);
    }

    const isExist = data.owners.find((o) => o?.email === req.body.email);

    if (isExist) res.status(400).send("Email is already exist");

    const salt = await bcrypt.genSalt(10);
    const password = await bcrypt.hash(req.body.password, salt);

    const token = await generateAccessToken(req.body.email);

    const newOwner = {
      name: req.body.name,
      address: req.body.address,
      email: req.body.email,
      id: uuidv4(),
      token: token,
    };
    const newData = {
      ...data,
      owners: [...data.owners, { ...newOwner, password: password }],
    };
    fs.writeFile("db.json", JSON.stringify(newData), (err) => {
      if (err) res.status(500).send("An error when trying to save new data");
      res.status(201).send({ ...newOwner, token });
    });
  } catch (error) {
    console.log(errors);
    res.status(500).send(error);
  }
});

router.get("/api/owners", authenticateToken, async (req, res) => {
  try {
    const data = JSON.parse(await fs.readFileSync("db.json"));
    res.status(200).json(data.owners);
  } catch (error) {
    res.status(500).send(error);
  }
});

router.get("/api/owners/:id", async (req, res) => {
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

router.put("/api/owners/:id", async (req, res) => {
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

router.delete("/api/owners/:id", async (req, res) => {
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

router.get("/api/pets", async (req, res) => {
  try {
    const data = JSON.parse(await fs.readFileSync("db.json"));
    res.status(200).send(data.pets);
  } catch (error) {
    res.status(500).send(error);
  }
});

router.get("/api/posts", async (req, res) => {
  try {
    const data = JSON.parse(await fs.readFileSync("db.json"));
    const pets = data.pets;
    let posts = [];
    pets.map((pet) => {
      const owner = data.owners.find((o) => o.id === pet.ownerId);
      posts.push({
        ...pet,
        owner,
      });
    });

    res.status(200).send(posts);
  } catch (error) {
    res.status(500).send(error);
  }
});

router.post("/api/posts", async (req, res) => {
  try {
    const data = JSON.parse(await fs.readFileSync("db.json"));
    const schema = Joi.object({
      lost_date: Joi.string().min(3).required(),
      pet_name: Joi.string().min(3).required(),
      breed: Joi.string().min(3).required(),
      zip_code: Joi.string().length(5).required(),
      ownerId: Joi.required(),
      image_src: Joi.string(),
    });
    const result = schema.validate(req.body);
    if (result.error) {
      res.status(400).send(result.error.details[0].message);
      return;
    }
    const owner = data.owners.find((o) => o.id === req.body.ownerId);
    if (!owner) {
      res.status(404).send("the owner with the given ID was not found");
      return;
    }
    const newPet = {
      id: data.pets[data.pets.length].id + 1,
      ownerId: req.body.ownerId,
      lost_date: req.body.lost_date,
      pet_name: req.body.pet_name,
      breed: req.body.breed,
      zip_code: req.body.zip_code,
      image_src: req.body.image_src ?? null,
      posted_date: new Date(),
      owner,
    };
    const newData = {
      ...data,
      pets: [...data.pets, newPet],
    };
    fs.writeFile("db.json", JSON.stringify(newData), (err) => {
      if (err) {
        console.log(err);
        res.status(500).send("An error when trying to save new data");
        throw err;
      }
      res.status(201).json(newPet);
    });
  } catch (error) {
    res.status(500).send(error);
    return;
  }
});

router.put("/api/pets", async (req, res) => {
  try {
    const data = JSON.parse(await fs.readFileSync("db.json"));
    const schema = Joi.object({
      id: Joi.number().required(),
      pet_name: Joi.string(),
      lost_date: Joi.string(),
      breed: Joi.string(),
      image_src: Joi.string(),
    });
    const result = schema.validate(req.body);
    if (result.error) {
      res.status(400).send(result.error.details[0].message);
      return;
    }
    const pet = data.pets.find((p) => p.id === req.body.id);
    if (!pet) {
      res.status(404).send("the pet with the given ID was not found");
      return;
    }
    const newPet = {
      id: pet.id,
      lost_date: req.body.lost_date ?? pet.lost_date,
      pet_name: req.body.pet_name ?? pet.pet_name,
      breed: req.body.breed ?? pet.breed,
      image_src: req.body.image_src ?? null,
      ownerId: pet.ownerId,
      owner: data.owners.filter((o) => o.id === pet.ownerId),
    };
    const newData = {
      ...data,
      pets: [...data.pets.filter((p) => p.id !== req.body.id), newPet],
    };
    fs.writeFile("db.json", JSON.stringify(newData), (err) => {
      if (err) {
        console.log(err);
        res.status(500).send("An error when trying to save new data");
        throw err;
      }
      res.status(200).json(newPet);
    });
  } catch (error) {
    res.status(500).send(error);
    return;
  }
});

router.delete("/api/pets", async (req, res) => {
  try {
    const data = JSON.parse(await fs.readFileSync("db.json"));
    const schema = Joi.object({
      id: Joi.number().required(),
    });
    const result = schema.validate(req.body);
    if (result.error) {
      res.status(400).send(result.error.details[0].message);
      return;
    }
    const pet = data.pets.find((p) => p.id === req.body.id);
    if (!pet) {
      res.status(404).send("the pet with the given ID was not found");
      return;
    }
    const newData = {
      ...data,
      pets: data.pets.filter((p) => p.id !== req.body.id),
    };
    fs.writeFile("db.json", JSON.stringify(newData), (err) => {
      if (err) {
        res.status(500).send("An error when trying to save new data");
        throw err;
      }
      res.status(200).json("pet deleted");
    });
  } catch (error) {
    res.status(500).send(error);
    return;
  }
});

app.use("/v1", router);

app.listen(8080, () => {
  console.log("Serveur à l'écoute");
});

module.exports = app;
