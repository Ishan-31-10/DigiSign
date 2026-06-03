'use client';

import { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { PenLine, Type, Eraser } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';

type Mode = 'draw' | 'type';

export type CreatedSignature =
  | { type: 'draw'; dataUrl: string; label: string }
  | { type: 'type'; text: string; fontFamily: string; label: string };

type Props = {
  onConfirm: (sig: CreatedSignature) => void;
  onCancel?: () => void;
  showSaveOption?: boolean;
  onConfirmAndSave?: (sig: CreatedSignature) => void;
};

const FONTS = [
  { name: 'Helvetica', value: 'Helvetica, Arial, sans-serif' },
  { name: 'Cursive', value: '"Dancing Script", "Brush Script MT", cursive' },
  { name: 'Mono', value: '"Courier New", monospace' },
  { name: 'Serif', value: 'Georgia, "Times New Roman", serif' },
];

export function SignaturePad({ onConfirm, onCancel, showSaveOption, onConfirmAndSave }: Props) {
  const [mode, setMode] = useState<Mode>('draw');
  const [label, setLabel] = useState('My signature');
  const [text, setText] = useState('');
  const [font, setFont] = useState(FONTS[1].value);
  const padRef = useRef<SignatureCanvas | null>(null);

  const clear = () => padRef.current?.clear();

  const build = (): CreatedSignature | null => {
    if (mode === 'draw') {
      const pad = padRef.current;
      if (!pad || pad.isEmpty()) return null;
      const dataUrl = pad.getTrimmedCanvas().toDataURL('image/png');
      return { type: 'draw', dataUrl, label };
    } else {
      if (!text.trim()) return null;
      return { type: 'type', text: text.trim(), fontFamily: font, label };
    }
  };

  const handleConfirm = (saveAlso: boolean) => {
    const sig = build();
    if (!sig) return;
    if (saveAlso && onConfirmAndSave) onConfirmAndSave(sig);
    else onConfirm(sig);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
        <button
          onClick={() => setMode('draw')}
          className={cn(
            'flex flex-1 items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition-colors',
            mode === 'draw' ? 'bg-white text-slate-900 shadow' : 'text-slate-600 hover:text-slate-900'
          )}
        >
          <PenLine className="h-4 w-4" /> Draw
        </button>
        <button
          onClick={() => setMode('type')}
          className={cn(
            'flex flex-1 items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition-colors',
            mode === 'type' ? 'bg-white text-slate-900 shadow' : 'text-slate-600 hover:text-slate-900'
          )}
        >
          <Type className="h-4 w-4" /> Type
        </button>
      </div>

      {mode === 'draw' ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div className="rounded-lg border border-slate-200 bg-white">
            <SignatureCanvas
              ref={padRef}
              penColor="#0f172a"
              canvasProps={{
                className: 'signature-pad-canvas',
                style: { width: '100%', height: 180 },
              }}
            />
          </div>
          <div className="mt-2 flex justify-end">
            <Button variant="ghost" size="sm" onClick={clear} leftIcon={<Eraser className="h-4 w-4" />}>
              Clear
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <Input
            label="Signature text"
            placeholder="Type your name"
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={60}
          />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Font style</label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {FONTS.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setFont(f.value)}
                  className={cn(
                    'rounded-lg border bg-white px-3 py-2 text-base',
                    font === f.value ? 'border-brand-500 ring-2 ring-brand-200' : 'border-slate-200'
                  )}
                  style={{ fontFamily: f.value }}
                >
                  {f.name}
                </button>
              ))}
            </div>
          </div>
          {text && (
            <div className="rounded-lg border border-slate-200 bg-white p-4 text-center text-2xl text-slate-900" style={{ fontFamily: font }}>
              {text}
            </div>
          )}
        </div>
      )}

      <Input
        label="Label (only used in your library)"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        maxLength={60}
      />

      <div className="flex flex-wrap justify-end gap-2">
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        {showSaveOption && (
          <Button variant="secondary" onClick={() => handleConfirm(true)}>
            Use & save
          </Button>
        )}
        <Button onClick={() => handleConfirm(false)}>Use signature</Button>
      </div>
    </div>
  );
}
