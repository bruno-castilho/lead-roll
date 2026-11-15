// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { create } from "qrcode";
import { describe, expect, it } from "vitest";
import { QrCode, qrCodePath } from "./qr-code";

const LINK = "https://leadroll.app/corretor/presenca?token=abc";

describe("qrCodePath", () => {
  it("desenha um quadrado por módulo escuro, com margem de 4 módulos", () => {
    const { modules } = create(LINK, { errorCorrectionLevel: "M" });
    const dark = modules.data.filter(Boolean).length;
    const { size, path } = qrCodePath(LINK);
    expect(size).toBe(modules.size + 8);
    expect(path.match(/M/g)).toHaveLength(dark);
    // O canto superior esquerdo do padrão de posição é sempre escuro.
    expect(path.startsWith("M4 4h1v1h-1z")).toBe(true);
  });

  it("muda quando o link muda", () => {
    expect(qrCodePath(`${LINK}1`).path).not.toBe(qrCodePath(`${LINK}2`).path);
  });
});

describe("QrCode", () => {
  it("é uma imagem com descrição", () => {
    render(<QrCode value={LINK} label="QR code de presença" />);
    const image = screen.getByRole("img", { name: "QR code de presença" });
    expect(image.getAttribute("viewBox")).toBe(
      `0 0 ${qrCodePath(LINK).size} ${qrCodePath(LINK).size}`,
    );
  });
});
