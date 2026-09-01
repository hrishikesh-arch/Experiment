import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const experiments = await prisma.experiment.findMany({
    include: {
      sessions: true,
      conditions: true,
    },
    orderBy: { createdAt: 'desc' }
  });

  async function createGroup(formData: FormData) {
    "use server";
    const name = formData.get("name") as string;
    const groupCode = formData.get("groupCode") as string;
    
    const experiment = await prisma.experiment.create({
      data: {
        name,
        groupCode,
        status: "ACTIVE",
        description: "Admin created group",
      }
    });

    // Create a default condition for it
    await prisma.condition.create({
      data: {
        experimentId: experiment.id,
        name: "Default Condition",
        bystanderCount: 10,
        activityLevel: "MEDIUM",
        participantTargeting: "MEDIUM",
        scenarioType: "REQUEST_HELP",
        scenarioDelaySeconds: 60,
      }
    });

    revalidatePath("/admin");
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8 text-black">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Research Dashboard</h1>
          <a
            href="/api/admin/export"
            className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700"
          >
            Export Data (CSV)
          </a>
        </div>

        <div className="bg-white p-6 rounded-lg shadow mb-8 border-l-4 border-green-500">
          <h2 className="text-xl font-bold mb-4">Create New Group</h2>
          <form action={createGroup} className="flex gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Group Name</label>
              <input type="text" name="name" required className="border p-2 rounded w-64 text-black" placeholder="e.g., Study Cohort B" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Group Code (Unique)</label>
              <input type="text" name="groupCode" required className="border p-2 rounded w-48 text-black uppercase" placeholder="e.g., COHORT-B" />
            </div>
            <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 font-medium">
              Create Group
            </button>
          </form>
        </div>

        <h2 className="text-2xl font-bold mb-4">Active Groups (Permanent)</h2>
        <div className="grid grid-cols-1 gap-6">
          {experiments.map((exp) => (
            <div key={exp.id} className="bg-white p-6 rounded-lg shadow">
              <div className="flex justify-between">
                <h2 className="text-xl font-semibold mb-2">{exp.name}</h2>
                <span className="font-mono bg-blue-100 text-blue-800 px-3 py-1 rounded text-lg font-bold">{exp.groupCode}</span>
              </div>
              <div className="text-sm text-gray-600 mb-4">
                <p>Status: {exp.status}</p>
                <p>Total Sessions: {exp.sessions.length}</p>
                <p>Created: {exp.createdAt.toLocaleDateString()}</p>
              </div>

              <h3 className="font-semibold text-lg mt-4 mb-2">Conditions</h3>
              <ul className="list-disc pl-5 mb-4">
                {exp.conditions.map((cond) => (
                  <li key={cond.id} className="text-sm text-gray-700">
                    {cond.name} — {cond.bystanderCount} bystanders
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
