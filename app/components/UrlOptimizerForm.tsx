"use client";

import { useState } from "react";
import { parseAsin } from "@/lib/ingest/parseAsin";

export function UrlOptimizerForm() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const asin = parseAsin(url);
    if (asin) {
      setResult(`Parsed ASIN: ${asin}`);
    } else if (url.trim()) {
      setResult(`Could not parse ASIN from: ${url.trim()}`);
    } else {
      setResult("Enter an Amazon product URL or ASIN.");
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6 py-12">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">
          Listing Optimizer
        </h1>
        <p className="mt-2 text-slate-600">
          Paste an Amazon product URL to generate optimized, compliance-verified
          listing inputs.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">
            Amazon listing URL or ASIN
          </span>
          <input
            type="text"
            name="url"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://www.amazon.com/dp/B0XXXXXXXXX"
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 shadow-sm outline-none ring-orange-500 focus:ring-2"
          />
        </label>

        <button
          type="submit"
          className="w-full rounded-lg bg-orange-600 px-4 py-3 font-medium text-white transition hover:bg-orange-700"
        >
          Optimize
        </button>
      </form>

      {result && (
        <output
          aria-live="polite"
          className="mt-6 rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-800"
        >
          {result}
        </output>
      )}
    </div>
  );
}
