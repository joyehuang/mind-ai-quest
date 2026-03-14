"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useMobile } from "@/components/hooks/useMobile";
import {
  buildFarmCertificateSvg,
  FARM_CERTIFICATE_HEIGHT,
  FARM_CERTIFICATE_WIDTH,
  farmCertificateSvgToDataUrl,
} from "@/lib/farm/certificate";
import type { FarmCertificateSnapshot } from "@/lib/farm/terminology";

interface FarmCertificateCardProps {
  certificate: FarmCertificateSnapshot;
}

async function certificatePngBlob(svg: string) {
  const imageUrl = farmCertificateSvgToDataUrl(svg);

  return new Promise<Blob>((resolve, reject) => {
    const image = new window.Image();

    image.onload = () => {
      const canvas = document.createElement("canvas");
      const scale = 2;
      canvas.width = FARM_CERTIFICATE_WIDTH * scale;
      canvas.height = FARM_CERTIFICATE_HEIGHT * scale;

      const context = canvas.getContext("2d");
      if (!context) {
        reject(new Error("Canvas is not supported"));
        return;
      }

      context.scale(scale, scale);
      context.drawImage(image, 0, 0, FARM_CERTIFICATE_WIDTH, FARM_CERTIFICATE_HEIGHT);
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error("Unable to export certificate"));
          return;
        }

        resolve(blob);
      }, "image/png");
    };

    image.onerror = () => reject(new Error("Unable to render certificate"));
    image.src = imageUrl;
  });
}

export default function FarmCertificateCard({ certificate }: FarmCertificateCardProps) {
  const [saving, setSaving] = useState(false);
  const [sharing, setSharing] = useState(false);
  const svg = useMemo(() => buildFarmCertificateSvg(certificate), [certificate]);
  const imageUrl = useMemo(() => farmCertificateSvgToDataUrl(svg), [svg]);
  const safeName = (certificate.playerName.trim() || "小老师").replace(/[\\/:*?"<>|]/g, "");

  async function exportFile() {
    const blob = await certificatePngBlob(svg);
    return new File([blob], `AI小当家-结业证书-${safeName}.png`, { type: "image/png" });
  }

  async function handleSave() {
    setSaving(true);

    try {
      const file = await exportFile();
      const url = URL.createObjectURL(file);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = file.name;
      anchor.click();
      URL.revokeObjectURL(url);
    } finally {
      setSaving(false);
    }
  }

  async function handleShare() {
    setSharing(true);

    try {
      const file = await exportFile();

      if (typeof navigator !== "undefined" && navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: "AI小当家·结业证书",
          text: "我拿到 AI小当家 的结业证书啦！",
          files: [file],
        });
        return;
      }

      await handleSave();
    } finally {
      setSharing(false);
    }
  }

  return (
    <section className="rounded-[30px] border border-[#d7bb7a] bg-[linear-gradient(180deg,rgba(255,250,236,0.98),rgba(248,236,199,0.96))] p-5 shadow-[0_24px_50px_rgba(76,54,20,0.18)] sm:p-6">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#8b6531]">结业证书</p>
          <h2 className="font-display mt-2 text-2xl text-[#53371b] sm:text-3xl">AI小当家·结业证书</h2>
        </div>
        <div className="ml-auto flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-2xl border border-[#ccab67] bg-[#fff7df] px-4 py-2 text-sm font-semibold text-[#6d4b1e] disabled:cursor-not-allowed disabled:opacity-60"
            onClick={handleSave}
            disabled={saving || sharing}
          >
            {saving ? "正在保存..." : "保存图片"}
          </button>
          <button
            type="button"
            className="rounded-2xl bg-[linear-gradient(135deg,#f3c86e_0%,#c98931_100%)] px-4 py-2 text-sm font-semibold text-[#2f1f0f] disabled:cursor-not-allowed disabled:opacity-60"
            onClick={handleShare}
            disabled={saving || sharing}
          >
            {sharing ? "正在准备分享..." : "分享"}
          </button>
        </div>
      </div>

      <div className="mt-5 rounded-[28px] border border-[#e2c889] bg-[rgba(255,253,247,0.94)] p-3 shadow-inner sm:p-4">
        <Image
          src={imageUrl}
          alt="AI小当家结业证书"
          width={FARM_CERTIFICATE_WIDTH}
          height={FARM_CERTIFICATE_HEIGHT}
          unoptimized
          className="h-auto w-full rounded-[22px] border border-[#ead9af] bg-white"
        />
      </div>
    </section>
  );
}
