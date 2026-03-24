'use client';

interface PreprocessPreviewProps {
  dataURL: string | null;
}

export default function PreprocessPreview({ dataURL }: PreprocessPreviewProps) {
  if (!dataURL) return null;

  return (
    <div style={{ marginTop: 8 }}>
      <p style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>Preprocessed Preview</p>
      <img
        src={dataURL}
        alt="Preprocessed"
        style={{
          width: '100%',
          borderRadius: 6,
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      />
    </div>
  );
}
