"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, Circle, AlertCircle, Loader2 } from "lucide-react";

type Step = "check" | "database" | "migration" | "admin" | "complete";

export default function InstallPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>("check");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [installStatus, setInstallStatus] = useState<any>(null);

  const [adminData, setAdminData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    checkInstallation();
  }, []);

  const checkInstallation = async () => {
    try {
      const res = await fetch("/api/install");
      const data = await res.json();
      setInstallStatus(data);

      if (data.isInstalled) {
        // Already installed, redirect to login
        router.push("/auth/signin");
      } else if (!data.dbConnected) {
        setCurrentStep("database");
      } else {
        setCurrentStep("migration");
      }
    } catch (err) {
      setError("Failed to check installation status");
      setCurrentStep("database");
    }
  };

  const testDatabase = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/install", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: "test-db" }),
      });

      const data = await res.json();

      if (data.success) {
        setCurrentStep("migration");
      } else {
        setError("Database connection failed. Please check your DATABASE_URL.");
      }
    } catch (err: any) {
      setError(err.message || "Database test failed");
    } finally {
      setLoading(false);
    }
  };

  const runMigration = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/install", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: "run-migration" }),
      });

      const data = await res.json();

      if (data.success) {
        setCurrentStep("admin");
      } else {
        setError(data.error || "Migration failed");
      }
    } catch (err: any) {
      setError(err.message || "Migration failed");
    } finally {
      setLoading(false);
    }
  };

  const createAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validation
    if (adminData.password !== adminData.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (adminData.password.length < 8) {
      setError("Password must be at least 8 characters");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/install", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step: "create-admin",
          data: {
            name: adminData.name,
            email: adminData.email,
            password: adminData.password,
          },
        }),
      });

      const data = await res.json();

      if (data.success) {
        setCurrentStep("complete");
      } else {
        setError(data.error || "Failed to create admin user");
      }
    } catch (err: any) {
      setError(err.message || "Failed to create admin user");
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { id: "check", label: "System Check", icon: CheckCircle },
    { id: "database", label: "Database", icon: Circle },
    { id: "migration", label: "Migration", icon: Circle },
    { id: "admin", label: "Admin User", icon: Circle },
    { id: "complete", label: "Complete", icon: CheckCircle },
  ];

  const getStepIndex = (step: Step) => steps.findIndex((s) => s.id === step);
  const currentStepIndex = getStepIndex(currentStep);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Nilotic Suits ERP
          </h1>
          <p className="text-gray-600">Installation Wizard</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  index <= currentStepIndex
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-400"
                }`}
              >
                {index < currentStepIndex ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`w-16 h-1 ${
                    index < currentStepIndex ? "bg-blue-600" : "bg-gray-200"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-md mb-6 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Step Content */}
        <div className="space-y-6">
          {currentStep === "check" && (
            <div className="text-center py-8">
              <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Checking installation status...</p>
            </div>
          )}

          {currentStep === "database" && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Database Connection</h2>
              <p className="text-gray-600 mb-6">
                Please ensure your DATABASE_URL is configured in the environment
                variables.
              </p>

              <div className="bg-gray-50 p-4 rounded-md mb-6">
                <p className="text-sm font-mono break-all">
                  {installStatus?.envCheck.databaseUrl ? (
                    <span className="text-green-600">✓ DATABASE_URL configured</span>
                  ) : (
                    <span className="text-red-600">✗ DATABASE_URL missing</span>
                  )}
                </p>
              </div>

              <button
                onClick={testDatabase}
                disabled={loading}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Test Database Connection
              </button>
            </div>
          )}

          {currentStep === "migration" && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Database Migration</h2>
              <p className="text-gray-600 mb-6">
                Click the button below to run database migrations and create the
                required tables.
              </p>

              <button
                onClick={runMigration}
                disabled={loading}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Run Migrations
              </button>
            </div>
          )}

          {currentStep === "admin" && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Create Admin User</h2>
              <p className="text-gray-600 mb-6">
                Create the initial administrator account for your system.
              </p>

              <form onSubmit={createAdmin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <input
                    type="text"
                    value={adminData.name}
                    onChange={(e) =>
                      setAdminData({ ...adminData, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-md"
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input
                    type="email"
                    value={adminData.email}
                    onChange={(e) =>
                      setAdminData({ ...adminData, email: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-md"
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    value={adminData.password}
                    onChange={(e) =>
                      setAdminData({ ...adminData, password: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-md"
                    required
                    disabled={loading}
                    minLength={8}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={adminData.confirmPassword}
                    onChange={(e) =>
                      setAdminData({
                        ...adminData,
                        confirmPassword: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border rounded-md"
                    required
                    disabled={loading}
                    minLength={8}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Create Admin User
                </button>
              </form>
            </div>
          )}

          {currentStep === "complete" && (
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-semibold mb-2">Installation Complete!</h2>
              <p className="text-gray-600 mb-6">
                Your Nilotic Suits ERP system is ready to use.
              </p>

              <button
                onClick={() => router.push("/auth/signin")}
                className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Go to Login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
