export default function DebugStyles() {
  return (
    <div className="p-10 m-10 bg-slate-100 min-h-screen">
      <h1 className="text-4xl font-bold text-red-600 mb-6">Debug Styles</h1>
      
      <div className="space-y-6">
        {/* Test Box Model & Sizing */}
        <div className="bg-white p-8 rounded-lg shadow-lg border border-gray-200 w-96">
          <h2 className="text-xl font-bold mb-4">Sizing & Spacing</h2>
          <div className="w-full h-16 bg-blue-100 mb-4 flex items-center justify-center border border-blue-300">
            w-full h-16
          </div>
          <div className="flex gap-4 mb-4">
             <div className="w-16 h-16 bg-green-100 flex items-center justify-center border border-green-300">w-16</div>
             <div className="w-24 h-24 bg-green-100 flex items-center justify-center border border-green-300">w-24</div>
          </div>
          <p className="mb-2">Margin Bottom 2</p>
          <p className="mt-4">Margin Top 4</p>
        </div>

        {/* Test Standard Components */}
        <div className="bg-white p-8 rounded-lg shadow-lg border border-gray-200 w-96">
             <h2 className="text-xl font-bold mb-4">Buttons</h2>
             <div className="flex flex-col gap-2">
                 <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                    Standard Button (px-4 py-2)
                 </button>
                 <button className="px-2 py-1 bg-gray-200 text-gray-800 rounded">
                    Small Button (px-2 py-1)
                 </button>
                 <button className="p-4 bg-red-100 text-red-800 rounded">
                    Large Padding (p-4)
                 </button>
             </div>
        </div>
      </div>
    </div>
  );
}
