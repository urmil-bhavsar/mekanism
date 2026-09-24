const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Comment extends Model {
    static associate(models) {
      // A comment belongs to a reader (User)
      Comment.belongsTo(models.User, { foreignKey: 'readerId', as: 'reader' });
      // A comment belongs to an EBook
      Comment.belongsTo(models.EBook, { foreignKey: 'ebookId', as: 'ebook' });
    }
  }

  Comment.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 5
      }
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      allowNull: false,
      defaultValue: 'pending' // 🔐 Defaults to pending for author moderation
    }
  }, {
    sequelize,
    modelName: 'Comment',
    timestamps: true
  });

  return Comment;
};
