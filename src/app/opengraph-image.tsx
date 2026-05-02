import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Proposalio — AI Proposal Generator for Upwork Freelancers";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)",
          padding: "80px",
          fontFamily: "sans-serif",
        }}
      >
        {/* Badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            background: "rgba(99,102,241,0.2)",
            border: "1px solid rgba(99,102,241,0.4)",
            borderRadius: "99px",
            padding: "6px 16px",
            marginBottom: "32px",
          }}
        >
          <span style={{ color: "#a5b4fc", fontSize: "14px", fontWeight: 600, letterSpacing: "0.05em" }}>
            AI-POWERED · FREE TO START
          </span>
        </div>

        {/* Wordmark */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "14px",
              background: "#6366f1",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "28px",
              fontWeight: 800,
              color: "#fff",
            }}
          >
            P
          </div>
          <span style={{ fontSize: "48px", fontWeight: 800, color: "#f1f5f9", letterSpacing: "-1px" }}>
            Proposalio
          </span>
        </div>

        {/* Headline */}
        <div style={{ fontSize: "36px", fontWeight: 700, color: "#e2e8f0", lineHeight: 1.3, maxWidth: "800px", marginBottom: "24px" }}>
          Win more Upwork jobs with AI-written proposals
        </div>

        {/* Subline */}
        <div style={{ fontSize: "22px", color: "#94a3b8", maxWidth: "700px" }}>
          Tailored to your profile, your voice, and the job — generated in seconds.
        </div>

        {/* URL */}
        <div
          style={{
            position: "absolute",
            bottom: "60px",
            right: "80px",
            fontSize: "18px",
            color: "#475569",
          }}
        >
          ai-proposal-generator-chi.vercel.app
        </div>
      </div>
    ),
    size,
  );
}
