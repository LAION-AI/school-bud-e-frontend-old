export default function SettingsPanel() {
  return (
    <div className="bg-gray-100/90 backdrop-blur-sm rounded-xl p-5 border border-gray-200">
      <h2 className="text-xl font-bold mb-4 text-gray-900">Settings</h2>
      <div className="space-y-4">
        <div>
          <label
            htmlFor="volume-control"
            className="block text-sm font-medium mb-1 text-gray-700"
          >
            Audio Volume
          </label>
          <input
            id="volume-control"
            type="range"
            className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer"
          />
        </div>
        <div>
          <label
            htmlFor="text-speed"
            className="block text-sm font-medium mb-1 text-gray-700"
          >
            Text Speed
          </label>
          <select
            id="text-speed"
            className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-800"
          >
            <option>Slow</option>
            <option>Medium</option>
            <option>Fast</option>
          </select>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Auto-Play</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" value="" className="sr-only peer" />
            <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600" />
          </label>
        </div>
      </div>
    </div>
  );
} 