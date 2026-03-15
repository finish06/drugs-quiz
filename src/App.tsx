function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="mx-auto max-w-4xl px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900">drugs-quiz</h1>
          <p className="mt-1 text-sm text-gray-500">
            Pharmacy exam prep — drug names, classes, and brand/generic matching
          </p>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-8">
        <p className="text-gray-600">Select a quiz type to begin.</p>
      </main>
    </div>
  );
}

export default App;
