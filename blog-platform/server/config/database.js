const path = require('path');
const fs = require('fs');

(function loadEnvFromDisk() {
  const candidates = [
    path.join(__dirname, '..', '.env'),
    path.join(__dirname, '..', '..', '.env'),
    path.join(__dirname, '..', '..', '..', '.env'),
  ];
  const found = candidates.find((p) => fs.existsSync(p));
  if (found) require('dotenv').config({ path: found });
})();

const { Sequelize } = require('sequelize');

const dbPassword =
  process.env.DB_PASSWORD !== undefined && process.env.DB_PASSWORD !== null
    ? process.env.DB_PASSWORD
    : process.env.MYSQL_PASSWORD || '';

const sequelize = new Sequelize(
  process.env.DB_NAME || 'chuangxiang_blog',
  process.env.DB_USER || 'root',
  dbPassword,
  {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 3306,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    define: {
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: false,
    },
  }
);

module.exports = sequelize;
