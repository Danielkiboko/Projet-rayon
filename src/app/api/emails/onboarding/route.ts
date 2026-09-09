import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const { email, name, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
        <h2 style="color: #ff5722;">Bienvenue sur Rayons.net !</h2>
        <p>Bonjour ${name || "Fournisseur"},</p>
        <p>Votre compte fournisseur a été créé avec succès par l'administrateur.</p>
        <p>Voici vos identifiants temporaires pour vous connecter :</p>
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Email :</strong> ${email}</p>
          <p style="margin: 10px 0 0 0;"><strong>Mot de passe temporaire :</strong> <span style="font-size: 18px; letter-spacing: 2px; color: #333;">${password}</span></p>
        </div>
        <p>Veuillez vous connecter et changer votre mot de passe dès votre première connexion pour des raisons de sécurité.</p>
        <br/>
        <p>Cordialement,<br/>L'équipe Rayons.net</p>
      </div>
    `;

    await sendEmail({
      to: email,
      subject: "Vos accès fournisseur - Rayons.net",
      html: htmlContent,
    });

    return NextResponse.json({ success: true, message: "Email sent successfully" });
  } catch (error: any) {
    console.error("Failed to send onboarding email:", error);
    return NextResponse.json({ error: error.message || "Failed to send email" }, { status: 500 });
  }
}
