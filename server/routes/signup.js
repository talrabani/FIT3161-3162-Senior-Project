const express = require('express');
const router = express.Router();

const { hashPassword } = require('../utils/auth.js');
const { createUser } = require('../models/signup.js');

router.post('/', async (req, res) => {
  const { username, password } = req.body;
 
  const hash = await hashPassword( password );

  console.log(username, hash);

  try {
    await createUser( username, hash );
    res.status(201).json({ message: "User created successfully" });
  } catch (err) {
    console.error("Error creating user:", err.message);
    res.status(500).json({ message: "Failed to create user." });
  }
});


module.exports = router;

