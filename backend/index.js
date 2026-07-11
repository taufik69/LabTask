import "dotenv/config";
import { dbConnect } from "./src/config/database.config.js";
import { app } from "./src/app.js";
import logger from "./src/config/logger.config.js";

const PORT = process.env.PORT || 4000;

dbConnect()
  .then(() => {
    app.listen(PORT, () => {
      logger.info(
        `Server running in ${process.env.NODE_ENV} mode on port ${PORT}`
      );
    });
  })
  .catch((err) => {
    logger.error("Error connecting to database", err);
    process.exit(1);
  });
