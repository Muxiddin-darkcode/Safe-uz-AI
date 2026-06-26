console.log("Environment variable keys:");
for (const key of Object.keys(process.env)) {
  console.log(`- ${key}: ${process.env[key] ? "(has value)" : "(empty)"}`);
}
