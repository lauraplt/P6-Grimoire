const bcrypt = require('bcrypt');
const User = require('../Models/User');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();

// Controller for user signup
exports.signup = async (req, res, next) => {
  try {
    // Vérifier si l'email est déjà utilisé
    const existingUser = await User.findOne({ email: req.body.email });
    if (existingUser) {
      return res.status(400).json({
        error: true,
        message: 'Un compte existe déjà avec cet email',
      });
    }

    // Hash du mot de passe
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const user = new User({
      email: req.body.email,
      password: hashedPassword,
    });
    await user.save();

    // Réponse en cas de succès
    res.status(201).json({
      message: 'Compte créé avec succès',
      error: false,
    });
  } catch (error) {
    // En cas d'erreur lors de la création du compte
    console.error(error); // Optionnel pour débogage
    res.status(500).json({
      error: true,
      message: 'Erreur lors de la création du compte',
      details: error.message || 'Erreur inconnue',
    });
  }
};

// Controller for user login
exports.login = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(401).json({
        error: true,
        message: 'Aucun compte associé à cet email',
      });
    }

    const validPassword = await bcrypt.compare(req.body.password, user.password);
    if (!validPassword) {
      return res.status(401).json({
        error: true,
        message: 'Mot de passe incorrect',
      });
    }

    // Générer le token JWT
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '24h',
    });

    // Réponse en cas de succès
    res.status(200).json({
      userId: user._id,
      token,
      message: 'Connexion réussie',
      error: false,
    });
  } catch (error) {
    // En cas d'erreur lors de la connexion
    console.error(error); // Optionnel pour débogage
    res.status(500).json({
      error: true,
      message: 'Erreur de connexion',
      details: error.message || 'Erreur inconnue',
    });
  }
};
