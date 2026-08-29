import { NextResponse } from "next/server";
import { sendMobiShastraSMS } from "@/lib/sms";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone, message } = body;

    if (!phone || !message) {
      return NextResponse.json(
        { success: false, error: "Phone number and message are required" },
        { status: 400 }
      );
    }

    // Call our server-side utility to send the SMS
    const result = await sendMobiShastraSMS({
      mobileNo: phone,
      message: message,
    });

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error("SMS API Route Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to send SMS" },
      { status: 500 }
    );
  }
}
