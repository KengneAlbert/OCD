import { ImageResponse } from "next/og";
import { AFRICA_PATH, MADAGASCAR_PATH } from "@/components/brand/africa-glow";

export const alt = "OCD Live — Ton produit mérite d'être vu. Passe en live au studio à Lomé ou à distance.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "linear-gradient(135deg, #FFFFFF 0%, #FAF7F2 100%)",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            right: 40,
            top: 40,
            width: 560,
            height: 560,
            borderRadius: 9999,
            background: "radial-gradient(circle, rgba(255,217,160,0.95) 0%, rgba(255,217,160,0) 70%)",
          }}
        />
        <svg viewBox="-8 -10 400 416" width="520" height="540" style={{ position: "absolute", right: 60, top: 45 }}>
          <path d={AFRICA_PATH} fill="#FFFFFF" stroke="#F3E3CC" strokeWidth="3" />
          <path d={MADAGASCAR_PATH} fill="#FFFFFF" stroke="#F3E3CC" strokeWidth="3" />
          <circle cx="106" cy="171" r="9" fill="#E8792B" stroke="#fff" strokeWidth="3" />
        </svg>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 70px", width: 720 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              background: "#DC2626",
              color: "white",
              padding: "8px 18px",
              borderRadius: 999,
              fontSize: 22,
              fontWeight: 700,
              alignSelf: "flex-start",
            }}
          >
            <div style={{ width: 12, height: 12, borderRadius: 999, background: "white" }} />
            EN DIRECT
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 16, marginTop: 28 }}>
            <span style={{ fontSize: 96, fontWeight: 900, color: "#E8792B", letterSpacing: -3 }}>OCD</span>
            <span style={{ fontSize: 80, fontWeight: 900, color: "#111111" }}>Live</span>
          </div>
          <div style={{ fontSize: 40, fontWeight: 800, color: "#111111", lineHeight: 1.15, marginTop: 10 }}>
            Ton produit mérite d&apos;être vu.
          </div>
          <div style={{ fontSize: 28, color: "#5F5A55", marginTop: 18 }}>Au studio à Lomé ou à distance · Lancement le 1er décembre</div>
        </div>
      </div>
    ),
    size,
  );
}
