export default function log(message: any) {
  if (process.env.LOG_LEVEL === 'TRACE') {
    console.log(message);
  }
}