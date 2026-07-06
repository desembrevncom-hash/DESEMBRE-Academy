interface ExternalLinkViewerProps {
  url: string;
}

export function ExternalLinkViewer({ url }: ExternalLinkViewerProps) {
  return (
    <div className="p-6 bg-slate-50 border rounded-md flex flex-col items-center justify-center">
      <h3 className="text-lg font-medium mb-4">Liên kết ngoài</h3>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="px-4 py-2 bg-slate-800 text-white rounded hover:bg-slate-900 transition"
      >
        Mở liên kết
      </a>
    </div>
  );
}
