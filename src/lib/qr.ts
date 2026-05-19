import QRCode from "qrcode";

// Generuje QR kód pro českou bankovní platbu (formát SPAYD / Short Payment Descriptor)
export async function generatePaymentQR(params: {
  iban: string;
  amount: number;
  variableSymbol: string;
  message: string;
}): Promise<string> {
  const { iban, amount, variableSymbol, message } = params;

  // SPAYD formát pro českou platbu
  const spayd = [
    "SPD*1.0",
    `ACC:${iban}`,
    `AM:${amount.toFixed(2)}`,
    `CC:CZK`,
    `X-VS:${variableSymbol}`,
    `MSG:${message.substring(0, 60)}`,
  ].join("*");

  return QRCode.toDataURL(spayd, {
    width: 256,
    margin: 2,
    color: { dark: "#000000", light: "#ffffff" },
  });
}

// Zkrátí UUID na 8 číslic jako variabilní symbol
export function reservationToVS(reservationId: string): string {
  return reservationId.replace(/-/g, "").substring(0, 10).replace(/[a-f]/gi, (c) =>
    String(c.charCodeAt(0) - 87)
  ).substring(0, 10);
}
