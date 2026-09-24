const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class EBook extends Model {
        static associate(models) {
            // Setup Relationships
            EBook.belongsTo(models.User, { foreignKey: 'authorId', as: 'author' });
        }
    }

    EBook.init({
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        status: {
            type: DataTypes.ENUM('draft', 'published'),
        },
        // Add these attributes inside your EBook.init() block
        category: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'General'
        },
        rating: {
            type: DataTypes.FLOAT,
            allowNull: false,
            defaultValue: 0.0 // Average user rating
        },
        viewsCount: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0 // Track popularity
        }

    }, {
        sequelize,
        modelName: 'EBook',
        timestamps: true, // Set to false if your original setup didn't use timestamps
    });

    return EBook;
};
