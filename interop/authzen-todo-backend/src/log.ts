export default function log(message: unknown) {
  if (process.env.LOG_LEVEL === "TRACE") {
    console.log(message);
  }
}
