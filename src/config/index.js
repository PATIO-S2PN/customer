// const dotEnv = require("dotenv");

// if (process.env.NODE_ENV !== "prod") {
//   const configFile = `./.env.${process.env.NODE_ENV}`;
//   dotEnv.config({ path: configFile });
// } else {
//   dotEnv.config();
// }

// module.exports = {
//   // PORT: process.env.PORT,
//   // DB_URL: process.env.MONGODB_URI,
//   // APP_SECRET: process.env.APP_SECRET,
//   // EXCHANGE_NAME: process.env.EXCHANGE_NAME,
//   // MSG_QUEUE_URL: process.env.MSG_QUEUE_URL,
//   PORT: 8001,
//   DB_URL: 'mongodb://127.0.0.1:27017/LD_Customer',
//   APP_SECRET: 'jg_youtube_tutorial',
//   EXCHANGE_NAME: 'ONLINE_STORE',
//   MSG_QUEUE_URL: 'amqps://antkcxeq:pFOQu2slPkugBXJaTQgKLI9BlyJkGVkc@cow.rmq2.cloudamqp.com/antkcxeq',
//   CUSTOMER_SERVICE: "customer_service",
//   SHOPPING_SERVICE: "shopping_service",
// };

const dotEnv = require("dotenv");

dotEnv.config();

module.exports = {
  PORT: process.env.PORT,
  DB_URL: process.env.MONGODB_URI,
  APP_SECRET: process.env.APP_SECRET,
  EXCHANGE_NAME: process.env.EXCHANGE_NAME,
  MSG_QUEUE_URL: process.env.MSG_QUEUE_URL,
  VERIFICATION_URL: process.env.VERIFICATION_URL,
  RESET_URL: process.env.RESET_PASSWORD_URL,
  CUSTOMER_SERVICE: "customer_service",
  SHOPPING_SERVICE: "shopping_service",
};
