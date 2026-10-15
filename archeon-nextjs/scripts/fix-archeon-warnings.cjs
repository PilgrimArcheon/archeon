#!/usr/bin/env node
/**
 * Fix the four Next.js/ESLint warning categories in Archeon without replacing
 * entire source files. Designed for the October 2026 unified Next.js source.
 * Run from the archeon-nextjs directory: node scripts/fix-archeon-warnings.cjs
 */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const edits = new Map();

function stage(rel, change) {
  const file = path.join(root, rel);
  if (!fs.existsSync(file)) throw new Error(`Expected Archeon file missing: ${rel}. Run this from archeon-nextjs.`);
  const old = fs.readFileSync(file, 'utf8');
  const next = change(old);
  if (old !== next) edits.set(rel, { old, next });
}
function requireContains(text, needle, file) {
  if (!text.includes(needle)) throw new Error(`Unexpected source in ${file}: missing ${needle.slice(0,60)}. Nothing has been changed.`);
}

try {
  // 1. Use Next.js' Image for the three local Invoice Studio SVG icons.
  stage('src/app/app/invoice/InvoiceClient.tsx', src => {
    let count = 0;
    let out = src.replace(/<img\b([^>]*?\bsrc="\/images\/invoice-studio-icon\.svg"[^>]*?)\s*\/>/g, (_tag, attrs) => {
      const width = attrs.match(/\bwidth="(\d+)"/);
      const height = attrs.match(/\bheight="(\d+)"/);
      if (!width || !height) throw new Error('Invoice logo img has unexpected dimensions. Stopped for manual review.');
      count++;
      return `<Image src="/images/invoice-studio-icon.svg" width={${width[1]}} height={${height[1]}} alt="" />`;
    });
    const images = (out.match(/<Image\s+src="\/images\/invoice-studio-icon\.svg"/g) || []).length;
    if (images !== 3) throw new Error(`Expected 3 Invoice Studio icon images, found ${images}. Stopped for manual review.`);
    if (!out.includes('from "next/image"')) {
      requireContains(out, '"use client";', 'InvoiceClient.tsx');
      out = out.replace('"use client";', '"use client";\n\nimport Image from "next/image";');
    }
    console.log(`Invoice icons: ${count} converted, ${images} using next/image.`);
    return out;
  });

  // 2. Next.js self-hosted Manrope via next/font/google, no external <link>.
  stage('src/app/layout.tsx', src => {
    let out = src;
    if (!out.includes('from "next/font/google"')) {
      requireContains(out, 'import type { ReactNode } from "react";', 'layout.tsx');
      out = out.replace('import type { ReactNode } from "react";', 'import type { ReactNode } from "react";\nimport { Manrope } from "next/font/google";');
    }
    if (!out.includes('const manrope = Manrope(')) {
      requireContains(out, 'const siteUrl =', 'layout.tsx');
      out = out.replace('const siteUrl =', 'const manrope = Manrope({ subsets: ["latin"], display: "swap", variable: "--font-manrope" });\n\nconst siteUrl =');
    }
    if (out.includes('fonts.googleapis.com')) {
      const patterns = [
        /\s*<link\s+rel="preconnect"\s+href="https:\/\/fonts\.googleapis\.com"\s*\/>/,
        /\s*<link\s+rel="preconnect"\s+href="https:\/\/fonts\.gstatic\.com"\s+crossOrigin="anonymous"\s*\/>/,
        /\s*<link\s+href="https:\/\/fonts\.googleapis\.com\/css2\?family=Manrope[^\"]*"\s+rel="stylesheet"\s*\/>/,
      ];
      for (const p of patterns) {
        if (!p.test(out)) throw new Error('Unexpected Google font link structure in layout.tsx; stopped before editing.');
        out = out.replace(p, '');
      }
    }
    if (!out.includes('className={manrope.variable}')) {
      requireContains(out, '<html lang="en" suppressHydrationWarning>', 'layout.tsx');
      out = out.replace('<html lang="en" suppressHydrationWarning>', '<html lang="en" className={manrope.variable} suppressHydrationWarning>');
    }
    return out;
  });

  // Next/font uses an internal unique family name. Point existing font-family
  // declarations to its CSS variable, so every existing page still uses Manrope.
  const cssFiles = [];
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith('.css')) cssFiles.push(path.relative(root, full));
    }
  }
  walk(path.join(root, 'src'));
  for (const rel of cssFiles) {
    const original = fs.readFileSync(path.join(root, rel), 'utf8');
    if (!original.includes('Manrope')) continue;
    stage(rel, src => {
      let out = src.replace(/(font-family\s*:\s*)([^;}]+)/g, (_whole, prefix, family) =>
        prefix + family.replace(/(?<![\w-])(['"]?)Manrope\1(?![\w-])/g, 'var(--font-manrope)'));
      if (rel === 'src/app/monochrome.css')
        out = out.replace(/(--body-font\s*:\s*)['"]?Manrope['"]?/, '$1var(--font-manrope)');
      if (rel === 'src/styles/archeon-app-tokens.css')
        out = out.replace(/(--archeon-app-font\s*:\s*)['"]?Manrope['"]?/, '$1var(--font-manrope)');
      return out;
    });
  }

  // 3. persist is stable (useCallback with []), so this dependency is safe.
  stage('src/features/tackboard/useTackCloud.ts', src => {
    if (src.includes('return () => { active = false; };\n  }, [persist, schedule]);')) return src;
    const before = 'return () => { active = false; };\n  }, [schedule]);';
    requireContains(src, before, 'useTackCloud.ts');
    requireContains(src, 'const persist = useCallback(() => {', 'useTackCloud.ts');
    return src.replace(before, 'return () => { active = false; };\n  }, [persist, schedule]);');
  });

  // Also resolve the JSX apostrophe that blocked the immediately prior build.
  stage('src/components/archeon/RequestAppButton.tsx', src =>
    src.replace("Requests arrive in Archeon's private feedback inbox.",
      'Requests arrive in Archeon&apos;s private feedback inbox.'));

  if (edits.size === 0) {
    console.log('No changes needed: all targeted source patterns are already fixed.');
    process.exit(0);
  }
  // Plan and validate every edit before touching anything on disk.
  const backups = path.resolve(root, '..', 'archeon-warning-backups', new Date().toISOString().replace(/[:.]/g, '-'));
  for (const [rel, { old }] of edits) {
    const dest = path.join(backups, rel);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, old);
  }
  for (const [rel, { next }] of edits) fs.writeFileSync(path.join(root, rel), next);
  console.log(`Updated ${edits.size} files. Original files backed up at:\n${backups}`);
  console.log('Next: npm run typecheck && npm run build');
} catch (error) {
  console.error('Unable to apply safely:', error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
