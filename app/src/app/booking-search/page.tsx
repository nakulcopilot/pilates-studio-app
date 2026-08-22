"use client";

// Simple booking search page
export default function BookingSearchPage() {
  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Natural Language Booking Search</h1>
      
      <div className="bg-white rounded-lg p-6 shadow-md">
        <form onSubmit={(e) => e.preventDefault()}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Search for classes:
            </label>
            <input
              type="text"
              placeholder="e.g., 'reformer class Wednesday morning'"
              className="w-full padding border rounded"
              id="query"
            />
          </div>
          
          <button
            type="submit"
            className="w-full bg-green-600 text-white font-medium padding rounded hover:bg-green-700 transition-colors"
          >
            Search Classes
          </button>
        </form>
      </div>
      
      <div className="mt-6">
        <p className="text-sm text-gray-500">
          Enter a natural language query to find Pilates classes. Examples:
          &quot;reformer class Wednesday morning&quot;, &quot;mat class Friday
          evening&quot;, &quot;any class next week&quot;
        </p>
      </div>
    </div>
  );
}