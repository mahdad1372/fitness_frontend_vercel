import { useState } from "react";
import Cookies from "js-cookie";

export default function AIRecommendation() {
  const [recommendation, setRecommendation] = useState("");
  const [loadingRec, setLoadingRec] = useState(false);
  const [error, setError] = useState("");

  const getRecommendations = async () => {
    setLoadingRec(true);
    setError("");
    setRecommendation("");

    try {
      const token = Cookies.get("token");
      const userId = Cookies.get("userId");

      if (!token || !userId) {
        setError("You must be logged in to get recommendations.");
        return;
      }

      const response = await fetch(
        `https://fitness-backend-15563671567.europe-west8.run.app/api/recommendations/${userId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) throw new Error("Failed to get recommendations");

      const data = await response.json();
      setRecommendation(data.recommendation);
    } catch (err) {
      setError("Could not load recommendations. Please try again.");
    } finally {
      setLoadingRec(false);
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            AI Fitness Recommendations
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Personalized advice based on your fitness data
          </p>
        </div>
        <button
          onClick={getRecommendations}
          disabled={loadingRec}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loadingRec ? "Generating..." : "✨ Get AI Recommendations"}
        </button>
      </div>

      {error && (
        <p className="text-red-500 text-sm">{error}</p>
      )}

      {recommendation && (
        <div className="bg-gray-50 dark:bg-white/[0.05] rounded-xl p-5 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
          {recommendation}
        </div>
      )}

      {!recommendation && !loadingRec && !error && (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="text-4xl mb-3">🤖</div>
          <p className="text-gray-400 dark:text-gray-500 text-sm">
            Click the button to get personalized AI recommendations.
          </p>
        </div>
      )}
    </div>
  );
}