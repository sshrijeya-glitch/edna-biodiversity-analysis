import { Link } from 'react-router-dom'
import { ArrowRight, Dna, Microscope, Network, Waves, FileDown, ShieldAlert } from 'lucide-react'
import Helix from '../components/brand/Helix'
import Logo from '../components/brand/Logo'
import BackendStatus from '../components/layout/BackendStatus'

/**
 * Landing page. The hero states what the software does with the sample-to-answer
 * pipeline as the visual thesis — no invented statistics, because the backend
 * has no aggregate numbers to report and we will not fabricate any.
 */

// These are the real pipeline stages implemented in app/services/.
const STAGES = [
  {
    n: '01',
    title: 'Preprocess reads',
    body: 'Biopython parses FASTA and FASTQ, validates nucleotides, then filters on read length and Phred quality.',
    icon: Dna,
  },
  {
    n: '02',
    title: 'Assign taxonomy',
    body: 'Pairwise alignment against a local reference barcode database. Reads above the identity cutoff get a full lineage.',
    icon: Microscope,
  },
  {
    n: '03',
    title: 'Cluster the rest',
    body: 'Reads below the cutoff are grouped by 4-mer profile into candidate clusters instead of being discarded.',
    icon: Network,
  },
  {
    n: '04',
    title: 'Measure diversity',
    body: 'Species richness, Shannon index and Simpson index computed across identified taxa and unknown clusters.',
    icon: Waves,
  },
]

export default function Landing() {
  return (
    <div className="min-h-screen bg-abyss text-white overflow-hidden">
      {/* ---------- Nav ---------- */}
      <header className="relative z-10 px-5 sm:px-8 lg:px-12 h-[76px] flex items-center justify-between">
        <Logo to="/" tone="dark" />
        <div className="flex items-center gap-3">
          <div className="hidden sm:block">
            <BackendStatus tone="dark" />
          </div>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-teal text-white text-sm font-medium hover:bg-[#268D77] transition-colors"
          >
            Open workspace <ArrowRight size={15} />
          </Link>
        </div>
      </header>

      {/* ---------- Hero ---------- */}
      <section className="relative px-5 sm:px-8 lg:px-12 pt-12 pb-24 lg:pt-20 lg:pb-32">
        {/* Signature: the helix field. Ambient, monochrome, sits behind everything. */}
        <div className="absolute top-0 right-10 w-[260px] h-[1000px] pointer-events-none hidden md:block">
            <Helix width={260} height={1000} opacity={0.55} className="animate-drift" />
        </div>
        <div
          className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(47,169,143,0.13) 0%, transparent 70%)' }}
        />

        <div className="relative max-w-[1400px] mx-auto">
          <p className="eyebrow text-teal">Smart India Hackathon · SIH25042</p>

          <h1 className="mt-6 font-display font-bold leading-[0.98] tracking-[-0.03em] text-[42px] sm:text-[60px] lg:text-[76px] max-w-[16ch]">
            Every organism leaves
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-seafoam to-teal">
              DNA behind.
            </span>
          </h1>

          <p className="mt-7 text-[17px] sm:text-[19px] text-seafoam/70 max-w-[52ch] leading-relaxed">
            EcoGenome AI turns raw environmental DNA reads from water, soil and sediment into a
            taxonomic profile and a measured biodiversity assessment — including the sequences
            that match nothing known.
          </p>

          <div className="mt-9 flex flex-col sm:flex-row gap-3">
            <Link
              to="/samples/new"
              className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-xl bg-teal text-white font-medium hover:bg-[#268D77] transition-colors"
            >
              Create a sample <ArrowRight size={16} />
            </Link>
            <Link
              to="/dashboard"
              className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-xl border border-white/15 text-white font-medium hover:bg-white/[0.06] transition-colors"
            >
              View dashboard
            </Link>
          </div>

          {/* Audience — who this is actually for, stated plainly */}
          <div className="mt-16 pt-8 border-t border-white/[0.08]">
            <p className="eyebrow text-seafoam/40">Built for</p>
            <div className="mt-4 flex flex-wrap gap-x-8 gap-y-3">
              {[
                'Biodiversity researchers',
                'Environmental scientists',
                'Forest & wildlife departments',
                'Conservation organisations',
                'Monitoring agencies',
              ].map((label) => (
                <span key={label} className="text-[13.5px] text-seafoam/55">
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Pipeline ---------- */}
      <section className="relative px-5 sm:px-8 lg:px-12 py-20 bg-hull/50 border-y border-white/[0.06]">
        <div className="max-w-[1400px] mx-auto">
          <p className="eyebrow text-teal">The pipeline</p>
          <h2 className="mt-4 text-[30px] sm:text-[38px] font-bold leading-tight max-w-[20ch]">
            Four stages, from raw reads to a diversity index.
          </h2>
          <p className="mt-4 text-[15px] text-seafoam/60 max-w-[58ch] leading-relaxed">
            The numbering is real: each stage depends on the one before it, and the workspace
            runs them in order against your uploaded file.
          </p>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STAGES.map((stage) => (
              <article key={stage.n} className="glass rounded-2xl p-6">
                <div className="flex items-center justify-between">
                  <span className="grid place-items-center w-10 h-10 rounded-xl bg-teal/[0.12] text-seafoam">
                    <stage.icon size={18} strokeWidth={1.8} />
                  </span>
                  <span className="font-mono text-[13px] text-seafoam/35">{stage.n}</span>
                </div>
                <h3 className="mt-5 text-[16px] font-semibold">{stage.title}</h3>
                <p className="mt-2.5 text-[13.5px] text-seafoam/60 leading-relaxed">{stage.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Honest scope ---------- */}
      <section className="relative px-5 sm:px-8 lg:px-12 py-20">
        <div className="max-w-[1400px] mx-auto grid lg:grid-cols-2 gap-10 lg:gap-16">
          <div>
            <p className="eyebrow text-teal">What you get</p>
            <h2 className="mt-4 text-[28px] sm:text-[34px] font-bold leading-tight">
              Results you can hand to a reviewer.
            </h2>
            <ul className="mt-7 space-y-4">
              {[
                ['Species explorer', 'Every classified read with its full lineage and percentage identity.'],
                ['Unknown clusters', 'Unclassified reads grouped and labelled as candidates, never as discoveries.'],
                ['Diversity metrics', 'Richness, Shannon and Simpson computed over the full community.'],
                ['Exportable reports', 'A styled PDF summary and a per-read CSV, generated from your own sample.'],
              ].map(([title, body]) => (
                <li key={title} className="flex gap-4">
                  <span className="mt-2 w-1.5 h-1.5 rounded-full bg-teal shrink-0" />
                  <div>
                    <h3 className="text-[15px] font-semibold">{title}</h3>
                    <p className="mt-1 text-[13.5px] text-seafoam/60 leading-relaxed">{body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="glass rounded-2xl p-7 self-start">
            <span className="grid place-items-center w-10 h-10 rounded-xl bg-amber/15 text-amber">
              <ShieldAlert size={18} strokeWidth={1.8} />
            </span>
            <h3 className="mt-5 text-[17px] font-semibold">Prototype scope</h3>
            <p className="mt-3 text-[13.5px] text-seafoam/65 leading-relaxed">
              This is a hackathon prototype, not a validated scientific platform. Taxonomy is
              matched against a small local reference database seeded for demonstration, so
              species assignments reflect that database and not the full diversity of any
              real environment.
            </p>
            <p className="mt-3 text-[13.5px] text-seafoam/65 leading-relaxed">
              Sequence clusters that match nothing are reported as{' '}
              <span className="text-seafoam">potential unknown taxa</span> — a candidate for
              follow-up, not a claim of a new species.
            </p>
            <Link
              to="/dashboard"
              className="mt-6 inline-flex items-center gap-2 text-[13.5px] font-medium text-teal hover:gap-3 transition-all"
            >
              <FileDown size={15} /> Run the seeded demo sample
            </Link>
          </div>
        </div>
      </section>

      <footer className="px-5 sm:px-8 lg:px-12 py-8 border-t border-white/[0.06]">
        <div className="max-w-[1400px] mx-auto flex flex-col sm:flex-row justify-between gap-4">
          <p className="font-mono text-[11.5px] text-seafoam/40 uppercase tracking-[0.1em]">
            EcoGenome AI · SIH25042 Prototype
          </p>
          <p className="text-[12.5px] text-seafoam/40">
            Identifying taxonomy and assessing biodiversity from eDNA datasets
          </p>
        </div>
      </footer>
    </div>
  )
}
