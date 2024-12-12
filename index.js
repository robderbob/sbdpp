const mongoose = require("mongoose");

const logger = require("./lib/logger");

const MONGO_URI = process.env.MONGO_URI;

mongoose
  .connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true,
  })
  .then((result) => {
    logger.info("MongoDB connected");
  })
  .catch((err) => {
    logger.error("Unable to connect to MongoDB", err);
    process.exit(1);
  });

const experimentEngine = require("./engine/experimentEngine");
experimentEngine.runExperiments();
