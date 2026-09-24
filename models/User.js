const { Model } = require('sequelize');
const bcrypt = require('bcrypt');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    async validPassword(password) {
      return await bcrypt.compare(password, this.password);
    }

    static associate(models) {
      // Define relationships here
      User.hasMany(models.EBook, { foreignKey: 'authorId', as: 'ebooks', onDelete: 'CASCADE' });
    }
  }

  User.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: { isEmail: true }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    role: {
      type: DataTypes.ENUM('author', 'reader'),
      allowNull: false,
      defaultValue: 'reader'
    }
  }, {
    sequelize,
    modelName: 'User',
    timestamps: true,
    // 🔐 Security Layer: Scopes configuration
    defaultScope: {
      attributes: { exclude: ['password'] } // Automatically hides password everywhere
    },
    scopes: {
      withPassword: {
        attributes: {}, // Clears the exclusion to bring the password back
      }
    },
    hooks: {
      beforeSave: async (user) => {
        if (user.changed('password')) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
    },
  });

  return User;
};
