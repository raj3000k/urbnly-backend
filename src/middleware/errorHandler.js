const { Prisma } = require("@prisma/client");

function errorHandler(error, _req, res, _next) {
  let statusCode = error.statusCode || 500;
  let message = error.message || "Something went wrong";

  if (error instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400;
    message = "Invalid request data";
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2025") {
      statusCode = 404;
      message = "Requested record was not found";
    } else if (error.code === "P2002") {
      statusCode = 409;
      message = "A record with this value already exists";
    }
  }

  const shouldExposeStack = process.env.NODE_ENV !== "production";

  console.error(
    JSON.stringify({
      level: "error",
      type: "error",
      statusCode,
      message,
      timestamp: new Date().toISOString(),
      stack: shouldExposeStack ? error.stack : undefined,
    })
  );

  res.status(statusCode).json({
    message,
    ...(shouldExposeStack && error.stack ? { stack: error.stack } : {}),
  });
}

module.exports = errorHandler;
