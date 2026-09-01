"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"user" | "admin">("user");
  
  // Participant State
  const [participantStep, setParticipantStep] = useState<1 | 2>(1);
  const [participantName, setParticipantName] = useState("");
  const [participantPhone, setParticipantPhone] = useState("");
  const [participantEmail, setParticipantEmail] = useState("");
  const [groupCode, setGroupCode] = useState("");
  
  // Admin fields
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPhone, setAdminPhone] = useState("");
  const [adminCode, setAdminCode] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleParticipantStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!participantName.trim() || !participantPhone.trim()) {
      setError("Please fill in all fields.");
      return;
    }
    setError("");
    setParticipantStep(2);
  };

  const handleParticipantStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupCode.trim()) return;

    setLoading(true);
    setError("");

    try {
      // Create user and validate code in one step
      const res = await fetch("/api/participant/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name: participantName.trim(), 
          email: participantEmail.trim() || "no-email@test.com", 
          phone: participantPhone.trim(), 
          groupCode: groupCode.trim().toUpperCase() 
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to validate group code");
        setLoading(false);
        return;
      }

      localStorage.setItem("sessionId", data.sessionId);
      localStorage.setItem("participantName", participantName.trim());
      router.push(`/chat/${data.sessionId}`);
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (
      adminUsername.toLowerCase() === "gowri k hari" &&
      adminPhone === "9778394353" &&
      adminCode === "ADMIN2026"
    ) {
      localStorage.setItem("isAdmin", "true");
      router.push("/admin");
    } else {
      setError("Invalid admin credentials");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-black">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Digital Community
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white shadow sm:rounded-lg overflow-hidden">
          <div className="flex border-b">
            <button
              onClick={() => { setActiveTab("user"); setError(""); setParticipantStep(1); }}
              className={`flex-1 py-3 text-center font-medium text-sm ${activeTab === "user" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
            >
              Participant Login
            </button>
            <button
              onClick={() => { setActiveTab("admin"); setError(""); }}
              className={`flex-1 py-3 text-center font-medium text-sm ${activeTab === "admin" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
            >
              Admin Login
            </button>
          </div>

          <div className="p-8">
            {activeTab === "user" ? (
              participantStep === 1 ? (
                <form className="space-y-6" onSubmit={handleParticipantStep1}>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Full Name</label>
                    <input
                      type="text"
                      required
                      value={participantName}
                      onChange={(e) => setParticipantName(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-black"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                    <input
                      type="tel"
                      required
                      value={participantPhone}
                      onChange={(e) => setParticipantPhone(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-black"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email (Optional)</label>
                    <input
                      type="email"
                      value={participantEmail}
                      onChange={(e) => setParticipantEmail(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-black"
                    />
                  </div>
                  {error && <div className="text-red-600 text-sm font-medium">{error}</div>}
                  <button
                    type="submit"
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Continue
                  </button>
                </form>
              ) : (
                <form className="space-y-6" onSubmit={handleParticipantStep2}>
                  <div>
                    <label htmlFor="groupCode" className="block text-sm font-medium text-gray-700">
                      Enter Group Code
                    </label>
                    <div className="mt-1">
                      <input
                        id="groupCode"
                        type="text"
                        required
                        value={groupCode}
                        onChange={(e) => setGroupCode(e.target.value.toUpperCase())}
                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-black font-mono text-center text-xl tracking-widest"
                        placeholder="XXXXXX"
                      />
                    </div>
                  </div>

                  {error && <div className="text-red-600 text-sm font-medium">{error}</div>}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400"
                  >
                    {loading ? "Joining..." : "Join Group"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setParticipantStep(1)}
                    className="w-full text-sm text-blue-600 hover:text-blue-500 mt-2 text-center"
                  >
                    &larr; Back to details
                  </button>
                </form>
              )
            ) : (
              <form className="space-y-6" onSubmit={handleAdminLogin}>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Full Name</label>
                  <input
                    type="text"
                    required
                    value={adminUsername}
                    onChange={(e) => setAdminUsername(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-black"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                  <input
                    type="text"
                    required
                    value={adminPhone}
                    onChange={(e) => setAdminPhone(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-black"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Admin Code</label>
                  <input
                    type="password"
                    required
                    value={adminCode}
                    onChange={(e) => setAdminCode(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-black"
                  />
                </div>

                {error && <div className="text-red-600 text-sm font-medium">{error}</div>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:bg-gray-400"
                >
                  {loading ? "Authenticating..." : "Login as Admin"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
