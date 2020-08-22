const { Router } = require("express");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const { check, validationResult } = require("express-validator");
const jwt =  require("jsonwebtoken")
const router = Router();
const config = require('config')

router.post(
  "/register",
  [
    check("email", "Некоректный email").isEmail(),
    check("password", "Некоректный password").isLength({ min: 6 }),
  ],
  async (req, res) => {
    try {
      
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          errors: errors.array(),
          message: "Некоректные данние валидации",
        });
      }

      const { email, password } = req.body;

      const candidate = await User.findOne({ email });

      if (candidate) {
        return res
          .status(400)
          .json({ message: "Такой пользователь уже сущестувует" });
      }
      const hashedPassword = await bcrypt.hash(password, 12);
      const user = new User({ email, password: hashedPassword });
      await user.save();

      res.status(201).json({ message: "Пользователь создан" });
    } catch (e) {
      res
        .status(500)
        .json({ message: "Что то пошло не так, попробуйте снова" });
    }
  }
);

router.post(
    "/login", 
    [
        check("email", "Введите коректный email").normalizeEmail().isEmail(),
        check("password", "Введите password").exists(),
    ],
    async (req, res) => {
    try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array(),
        message: "Некоректные данние при входе в систему",
      });
    }
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
        return res
          .status(400)
          .json({ message: "Такой пользователь не сущестувует" });
      }

      const isMatch = await bcrypt.compare(password,user.password)
      
      if(!isMatch){
        return res
        .status(400)
        .json({ message: "Неверный пароль, попробуйте снова" });
      }
    
      const token = jwt.sign(
          {userId:user.id}, 
          config.get('jwtSecret'),
          {expiresIn:'1h'}
          )

          res.json({token, userId: user.id});


  } catch (e) {
    res.status(500).json({ message: "Что то пошло не так, попробуйте снова" });
  }
});

module.exports = router;
