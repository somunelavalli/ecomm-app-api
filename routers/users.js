const { User } = require('../models/user');
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

router.get(`/:id`, async (req, res) => {
  if (req.params.id === 'all') {
    const userList = await User.find().select('-password');
    debugger;
    if (!userList) {
      res.status(500).json({ success: false });
    }
    res.send(userList);
  } else {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      res.status(500).json({ message: 'The User with give id is not found' });
    }
    res.status(200).send(user);
  }
});

router.get('/:id', async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');
  if (!user) {
    res.status(500).json({ message: 'The User with give id is not found' });
  }
  res.status(200).send(user);
});

router.post('/register', async (req, res) => {
  let user = new User({
    name: req.body.name,
    email: req.body.email,
    password: bcrypt.hashSync(req.body.password, 10),
    phone: req.body.phone,
    isAdmin: req.body.isAdmin,
    street: req.body.street,
    apartment: req.body.apartment,
    zip: req.body.zip,
    city: req.body.city,
    country: req.body.country,
  });
  user = await user.save();
  if (!user) return res.status(404).send('The User Cant be Created');
  res.send(user);
});

router.post('/login', async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  const secret = process.env.JWT_SECRET;
  if (!user) {
    return res.status(400).send('The user is not found with given Email');
  }

  if (user && bcrypt.compareSync(req.body.password, user.password)) {
    const token = jwt.sign(
      {
        userid: user.id,
        isAdmin: user.isAdmin,
      },
      secret,
      {
        expiresIn: '1d',
      }
    );
    res.status(200).send({ user: user.email, token });
  } else {
    res.status(400).send('Password is wrong');
  }
});

router.delete('/:id', (req, res) => {
  User.findByIdAndRemove(req.params.id)
    .then((user) => {
      if (user) {
        res
          .status(200)
          .json({
            status: 'Success',
            message: 'The user was deleted Successfully',
          });
      } else {
        res
          .status(404)
          .json({ status: 'failed', message: 'No user was found' });
      }
    })
    .catch((err) => {
      return res.status(400).json({ status: 'failed', error: err });
    });
});

router.get('/get/count', async (req, res) => {
  const usersCount = await User.countDocuments();
  if (!usersCount) res.status(400).json({ status: false });
  res.send({
    TotalUsers: usersCount,
  });
});

module.exports = router;
