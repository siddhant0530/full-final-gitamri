"use client";

import { useState } from "react";

interface OrderItem {
  productId: string;
  name: string;
}

function StarPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
          onClick={() => onChange(n)}
          className="text-2xl leading-none text-amber-500 transition hover:scale-110"
        >
          {n <= value ? "★" : "☆"}
        </button>
      ))}
    </div>
  );
}

export default function ReviewSubmissionForm({
  token,
  items,
}: {
  token: string;
  items: OrderItem[];
}) {
  const [customerName, setCustomerName] = useState("");
  const [drafts, setDrafts] = useState<Record<string, { rating: number; text: string }>>(
    Object.fromEntries(items.map((i) => [i.productId, { rating: 5, text: "" }]))
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  async function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoPreview(URL.createObjectURL(file));
    setUploadingPhoto(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/reviews/upload-photo", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not upload photo. Please try again.");
        setPhotoPreview(null);
        return;
      }
      setPhotoUrl(data.url);
    } catch {
      setError("Could not upload photo. Please check your connection and try again.");
      setPhotoPreview(null);
    } finally {
      setUploadingPhoto(false);
    }
  }

  function updateDraft(productId: string, field: "rating" | "text", value: number | string) {
    setDrafts((d) => ({ ...d, [productId]: { ...d[productId], [field]: value } }));
  }

  async function handleSubmit() {
    setError("");
    if (!customerName.trim()) {
      setError("Please enter your name.");
      return;
    }
    const reviews = items
      .map((i) => ({ productId: i.productId, ...drafts[i.productId] }))
      .filter((r) => r.text.trim().length > 0);
    if (reviews.length === 0) {
      setError("Please write at least one review before submitting.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          customerName: customerName.trim(),
          photo: photoUrl || undefined,
          reviews,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not submit your review. Please try again.");
        return;
      }
      setDone(true);
    } catch {
      setError("Could not reach the server. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
        <p className="text-4xl">🙏</p>
        <h2 className="mt-3 text-xl font-bold text-[#123524]">Thank you!</h2>
        <p className="mt-2 text-zinc-600">
          Your review has been submitted and will appear on the site once it&apos;s reviewed.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <label className="block text-sm font-semibold text-zinc-800">Your name</label>
        <input
          type="text"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          placeholder="e.g. Priya Sharma"
          className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-zinc-800">
          Add a photo <span className="font-normal text-zinc-400">(optional)</span>
        </label>
        <div className="mt-2 flex items-center gap-4">
          {photoPreview && (
            <img
              src={photoPreview}
              alt="Your upload"
              className="h-20 w-20 rounded-lg object-cover"
            />
          )}
          <label className="cursor-pointer rounded-lg border border-dashed border-gray-300 px-4 py-3 text-sm text-zinc-600 hover:border-amber-400">
            {uploadingPhoto ? "Uploading…" : photoUrl ? "Change photo" : "Upload photo"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
              onChange={handlePhotoSelect}
              className="hidden"
              disabled={uploadingPhoto}
            />
          </label>
        </div>
      </div>

      {items.map((item) => (
        <div key={item.productId} className="rounded-2xl border border-gray-200 p-5">
          <p className="font-semibold text-[#123524]">{item.name}</p>
          <div className="mt-2">
            <StarPicker
              value={drafts[item.productId]?.rating ?? 5}
              onChange={(n) => updateDraft(item.productId, "rating", n)}
            />
          </div>
          <textarea
            value={drafts[item.productId]?.text ?? ""}
            onChange={(e) => updateDraft(item.productId, "text", e.target.value)}
            placeholder="How was it? (leave blank to skip this product)"
            rows={3}
            className="mt-3 w-full rounded-lg border border-gray-300 px-4 py-3 text-sm"
          />
        </div>
      ))}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={submitting || uploadingPhoto}
        className="w-full rounded-full bg-green-700 py-3 font-semibold text-white transition hover:bg-green-800 disabled:opacity-60"
      >
        {submitting ? "Submitting…" : "Submit Review"}
      </button>
    </div>
  );
}