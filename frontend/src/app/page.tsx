import Link from 'next/link';
import { PublicNav } from '@/components/layout/PublicNav';
import { Button } from '@/components/ui/Button';
import {
  FileSignature,
  Upload,
  ShieldCheck,
  PenLine,
  LayoutDashboard,
  Lock,
} from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen">
      <PublicNav />

      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 -top-24 -z-10 mx-auto h-[400px] max-w-5xl rounded-full bg-brand-200/40 blur-3xl" />
        <div className="mx-auto max-w-6xl px-4 pt-16 pb-24 text-center sm:pt-24">
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
            <ShieldCheck className="h-3.5 w-3.5" />
            Tamper-evident PDF signatures
          </span>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-900 sm:text-6xl">
            Sign, manage and verify
            <br />
            <span className="bg-gradient-to-r from-brand-600 to-indigo-500 bg-clip-text text-transparent">
              PDF documents with confidence
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-slate-600 sm:text-lg">
            DigSign is a modern, secure platform to upload PDFs, place
            electronic signatures, share signed documents and verify their
            authenticity through a public verification mechanism.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/register">
              <Button size="lg" rightIcon={<FileSignature className="h-4 w-4" />}>
                Start signing for free
              </Button>
            </Link>
            <Link href="/verify">
              <Button size="lg" variant="outline" rightIcon={<ShieldCheck className="h-4 w-4" />}>
                Verify a document
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-white border-y border-slate-100">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-16 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card hover:shadow-soft transition-shadow"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                {f.icon}
              </div>
              <h3 className="mt-4 text-base font-semibold text-slate-900">{f.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">
              How DigSign works
            </h2>
            <p className="mt-3 text-slate-600">
              Three steps from raw PDF to a signed, verifiable document.
            </p>
            <ol className="mt-8 space-y-5">
              {steps.map((s, i) => (
                <li key={s.title} className="flex gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white">
                    {i + 1}
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900">{s.title}</h4>
                    <p className="text-sm text-slate-600">{s.desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-brand-50 to-white p-6 shadow-soft">
            <div className="rounded-xl bg-white border border-slate-200 shadow-card p-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">
                  CONTRACT_DRAFT.pdf
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                  <ShieldCheck className="h-3 w-3" /> Signed
                </span>
              </div>
              <div className="mt-4 h-44 rounded-lg border border-dashed border-slate-300 bg-slate-50 flex items-end justify-end p-4">
                <div className="rounded-md border-2 border-dashed border-brand-400 bg-white px-3 py-2 text-sm italic text-brand-700">
                  Jane Doe
                </div>
              </div>
              <div className="mt-4 text-xs text-slate-500">
                <p>Verification ID: <span className="font-mono text-slate-700">A92F73C1</span></p>
                <p className="truncate">SHA-256: <span className="font-mono">9f3c…d201</span></p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-sm text-slate-500 sm:flex-row">
          <p>© {new Date().getFullYear()} DigSign — Built as an MVP demo.</p>
          <div className="flex gap-4">
            <Link href="/verify" className="hover:text-slate-700">Verify</Link>
            <Link href="/login" className="hover:text-slate-700">Sign in</Link>
            <Link href="/register" className="hover:text-slate-700">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

const features = [
  {
    icon: <Upload className="h-5 w-5" />,
    title: 'Effortless PDF upload',
    desc: 'Drag-and-drop PDFs up to 25 MB. We extract metadata and let you preview them instantly.',
  },
  {
    icon: <PenLine className="h-5 w-5" />,
    title: 'Draw or type signatures',
    desc: 'Sign with your mouse / touchscreen, or pick a typed signature. Save reusable signatures.',
  },
  {
    icon: <ShieldCheck className="h-5 w-5" />,
    title: 'Public verification',
    desc: 'Every signed document gets a verification ID and SHA-256 hash for third-party verification.',
  },
  {
    icon: <LayoutDashboard className="h-5 w-5" />,
    title: 'Full document dashboard',
    desc: 'Track status (uploaded / draft / signed), resume incomplete flows, manage signatures.',
  },
  {
    icon: <Lock className="h-5 w-5" />,
    title: 'Audited & secure',
    desc: 'JWT auth, rate limiting, password hashing, and a full audit log of every action.',
  },
  {
    icon: <FileSignature className="h-5 w-5" />,
    title: 'Tamper-evident signing',
    desc: 'Signed PDFs are hashed and stamped with a verification footer for downstream checks.',
  },
];

const steps = [
  {
    title: 'Upload your PDF',
    desc: 'Securely upload the document you need to sign. We store the original safely.',
  },
  {
    title: 'Place your signature',
    desc: 'Draw or type a signature, then drag and resize it to the right spot on any page.',
  },
  {
    title: 'Finalize & share',
    desc: 'We embed the signature, compute a hash and assign a verification ID. Share the signed PDF.',
  },
];
