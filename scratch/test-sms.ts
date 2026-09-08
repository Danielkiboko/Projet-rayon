import { sendMobiShastraSMS } from "../src/lib/sms";
import fs from "fs";

if (fs.existsSync(".env.local")) {
  const env = fs.readFileSync(".env.local", "utf8");
  env.split("\n").forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      process.env[match[1]] = match[2].trim().replace(/^"|"$/g, '');
    }
  });
}

async function test() {
  try {
    const res = await sendMobiShastraSMS({ mobileNo: "+243859180035", message: "Bonjour ! Ceci est un test de l'application Rayons." });
    console.log("Success!", res);
  } catch(e) {
    console.error(e);
  }
}
test();
