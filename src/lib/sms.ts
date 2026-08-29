/**
 * Utilitaires pour envoyer des SMS via l'API MobiShastra
 */

interface SendSMSOptions {
  mobileNo: string;
  message: string;
  isUnicode?: boolean;
}

export async function sendMobiShastraSMS({ mobileNo, message, isUnicode = false }: SendSMSOptions) {
  const user = process.env.MOBISHASTRA_USER;
  const pwd = process.env.MOBISHASTRA_PWD;
  const senderId = process.env.MOBISHASTRA_SENDER_ID || "SMS Alert";

  if (!user || !pwd) {
    console.error("MobiShastra credentials are not configured in environment variables.");
    throw new Error("SMS service not configured");
  }

  // Format the URL as required by the Single SMS API
  // https://mshastra.com/sendurl.aspx?user=xxxxxxxx&pwd=xxxxxx&senderid=SMSAlert&mobileno=mobileno&msgtext=Hello&priority=High&CountryCode=ALL
  
  const baseUrl = "https://mshastra.com/sendurl.aspx";
  const params = new URLSearchParams({
    user: user,
    pwd: pwd,
    senderid: senderId,
    mobileno: mobileNo,
    msgtext: message,
    priority: "High",
    CountryCode: "ALL",
  });

  const url = `${baseUrl}?${params.toString()}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      // MobiShastra APIs generally don't require specific headers for GET requests
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.text();
    
    // Check for common error codes based on documentation
    if (data.includes("Invalid Mobile No") || data.includes("001")) {
      throw new Error("Invalid Receiver: " + mobileNo);
    } else if (data.includes("Invalid Password") || data.includes("005")) {
      throw new Error("SMS Authorization failed (Invalid credentials)");
    } else if (data.includes("010") || data.includes("Invalid Profile Id")) {
      throw new Error("Invalid Profile ID");
    } else if (data.includes("000") || data.includes("Send Successful")) {
      console.log(`SMS successfully sent to ${mobileNo}`);
      return { success: true, data };
    }

    // Default return if response format is unknown but request succeeded
    return { success: true, data };

  } catch (error) {
    console.error("Error sending SMS via MobiShastra:", error);
    throw error;
  }
}
