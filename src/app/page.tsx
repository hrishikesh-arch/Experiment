"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [groupCode, setGroupCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupCode.trim()) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/experiment/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupCode: groupCode.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to validate group code");
        setLoading(false);
        return;
      }

      // Valid code, redirect to registration
      router.push(`/join/${groupCode.trim()}`);
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Digital Community
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Enter your group code to join the conversation
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleJoin}>
            <div>
              <label htmlFor="groupCode" className="block text-sm font-medium text-gray-700">
                Group Code
              </label>
              <div className="mt-1">
                <input
                  id="groupCode"
                  name="groupCode"
                  type="text"
                  required
                  value={groupCode}
                  onChange={(e) => setGroupCode(e.target.value.toUpperCase())}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-black"
                  placeholder="e.g. X7K29P"
                />
              </div>
            </div>

            {error && (
              <div className="text-red-600 text-sm font-medium">
                {error}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400"
              >
                {loading ? "Checking..." : "Join Group"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
