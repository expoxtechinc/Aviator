import React from "react";
import type { PreviewKind } from "@/lib/preview";

type SecurePreviewProps = {
  url: string;
  kind: PreviewKind;
  onClose: () => void;
};

export default function SecurePreview({ url, kind, onClose }: SecurePreviewProps) {
  return <div className="preview-drawer"><div><b>Secure preview</b><button className="text-button" onClick={onClose}>Close</button></div>{kind === "video" ? <video controls autoPlay src={url} /> : kind === "audio" ? <audio controls autoPlay src={url} /> : <p className="muted">This secure preview is not directly playable in the browser. Download access remains protected and entitlement-controlled.</p>}</div>;
}
