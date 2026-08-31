import { prisma } from "@/lib/prisma";

export default async function AdminDashboard() {
  const experiments = await prisma.experiment.findMany({
    include: {
      sessions: true,
      conditions: true,
    }
  });

  return (
    <div className="min-h-screen bg-gray-100 p-8">
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

        <div className="grid grid-cols-1 gap-6">
          {experiments.map((exp) => (
            <div key={exp.id} className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-2">{exp.name}</h2>
              <div className="text-sm text-gray-600 mb-4">
                <p>Status: {exp.status}</p>
                <p>Group Code: <span className="font-mono bg-gray-200 px-1 rounded">{exp.groupCode}</span></p>
                <p>Total Sessions: {exp.sessions.length}</p>
              </div>

              <h3 className="font-semibold text-lg mt-4 mb-2">Conditions</h3>
              <ul className="list-disc pl-5 mb-4">
                {exp.conditions.map((cond) => (
                  <li key={cond.id} className="text-sm text-gray-700">
                    {cond.name} — {cond.bystanderCount} bystanders, {cond.activityLevel} activity
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
