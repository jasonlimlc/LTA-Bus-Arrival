import React, { useState } from 'react';
import { getStoredApiConfig, saveApiConfig, ApiConfig } from '../services/busArrivalEngine';
import { Server, CheckCircle2, Copy, AlertCircle, RefreshCw, Key, Globe, Terminal } from 'lucide-react';

interface BackendScaffoldingModalProps {
  onClose?: () => void;
  onConfigUpdated?: () => void;
}

export const BackendScaffoldingModal: React.FC<BackendScaffoldingModalProps> = ({
  onClose,
  onConfigUpdated,
}) => {
  const [config, setConfig] = useState<ApiConfig>(getStoredApiConfig());
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  const handleSave = () => {
    saveApiConfig(config);
    if (onConfigUpdated) onConfigUpdated();
  };

  const handleTestConnection = async () => {
    setTestStatus('testing');
    setTestMessage('Sending test request to ' + config.endpointUrl + '?BusStopCode=09048...');

    try {
      const url = new URL(config.endpointUrl, window.location.origin);
      url.searchParams.set('BusStopCode', '09048');

      const headers: Record<string, string> = { Accept: 'application/json' };
      if (config.apiKey) headers['AccountKey'] = config.apiKey;

      const res = await fetch(url.toString(), { headers });
      if (!res.ok) {
        throw new Error(`Endpoint returned status ${res.status}: ${res.statusText}`);
      }

      const json = await res.json();
      if (json && (json.Services || json.BusStopCode)) {
        setTestStatus('success');
        setTestMessage(`Success! Received valid LTA DataMall format with ${json.Services?.length ?? 0} bus services.`);
      } else {
        setTestStatus('success');
        setTestMessage('Response received (status 200), though schema differed slightly from standard LTA DataMall.');
      }
    } catch (err: any) {
      setTestStatus('error');
      setTestMessage(err.message || 'Unable to connect to endpoint. Please check if your server is running.');
    }
  };

  const SAMPLE_EXPRESS_CODE = `// server.js (Express LTA DataMall v2 Proxy)
import express from 'express';
import fetch from 'node-fetch';

const app = express();
const LTA_API_KEY = process.env.LTA_DATAMALL_KEY || 'YOUR_LTA_KEY_HERE';

app.get('/api/lta/v1/bus-arrivals', async (req, res) => {
  const { BusStopCode } = req.query;
  if (!BusStopCode) return res.status(400).json({ error: 'Missing BusStopCode' });

  try {
    const response = await fetch(
      \`http://datamall2.mytransport.sg/ltaodataservice/v3/BusArrival?BusStopCode=\${BusStopCode}\`,
      {
        headers: {
          AccountKey: LTA_API_KEY,
          accept: 'application/json',
        },
      }
    );
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3001, () => console.log('LTA Proxy listening on port 3001'));
`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(SAMPLE_EXPRESS_CODE);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-xs max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-emerald-600 mb-1">
          <Server className="w-5 h-5" />
          <span className="text-xs font-bold uppercase tracking-wider">Backend Connection Settings</span>
        </div>
        <h3 className="text-lg font-bold text-slate-900">
          LTA DataMall v2 Backend Architecture &amp; Scaffolding
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          The front end is currently running our high-fidelity real-time simulation engine. When you are ready to connect your backend proxy to Singapore Land Transport Authority (LTA) APIs, toggle live mode below.
        </p>
      </div>

      {/* Mode Toggle Switch */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <span>Data Provider:</span>
            <span className={`text-xs px-2 py-0.5 rounded font-semibold ${
              config.useLiveBackend
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-indigo-100 text-indigo-800'
            }`}>
              {config.useLiveBackend ? 'Live Backend API' : 'High-Fidelity Simulation'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {config.useLiveBackend
              ? 'Fetching live data from your configured API endpoint.'
              : 'Using realistic Singapore LTA timings, coordinates, and crowd levels with zero network dependencies.'}
          </p>
        </div>

        <button
          onClick={() => {
            const updated = { ...config, useLiveBackend: !config.useLiveBackend };
            setConfig(updated);
            saveApiConfig(updated);
            if (onConfigUpdated) onConfigUpdated();
          }}
          className={`px-4 py-2 text-xs font-semibold rounded-lg cursor-pointer transition-colors ${
            config.useLiveBackend
              ? 'bg-rose-100 text-rose-800 hover:bg-rose-200'
              : 'bg-emerald-600 text-white hover:bg-emerald-700'
          }`}
        >
          {config.useLiveBackend ? 'Switch to Simulation Mode' : 'Enable Live Backend API'}
        </button>
      </div>

      {/* API Endpoint Configuration */}
      <div className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1">
            Backend Proxy Endpoint URL
          </label>
          <div className="relative">
            <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={config.endpointUrl}
              onChange={(e) => setConfig({ ...config, endpointUrl: e.target.value })}
              placeholder="/api/lta/v1/bus-arrivals or https://your-server.com/api/bus-arrivals"
              className="w-full pl-9 pr-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-600"
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            The frontend automatically appends <code className="text-slate-600">?BusStopCode=[code]</code> to this URL.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              AccountKey / API Key Header (Optional)
            </label>
            <div className="relative">
              <Key className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={config.apiKey || ''}
                onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                placeholder="Optional LTA AccountKey"
                className="w-full pl-9 pr-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-600"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Sent in the <code className="text-slate-600">AccountKey</code> HTTP header if required.
            </p>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Auto-Refresh Rate: {config.autoRefreshIntervalSeconds}s
            </label>
            <input
              type="range"
              min="10"
              max="60"
              step="5"
              value={config.autoRefreshIntervalSeconds}
              onChange={(e) => setConfig({ ...config, autoRefreshIntervalSeconds: Number(e.target.value) })}
              className="w-full accent-emerald-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>10s (Fastest)</span>
              <span>20s (Default)</span>
              <span>60s</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-slate-900 text-white hover:bg-slate-800 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
          >
            Save Configuration
          </button>

          <button
            onClick={handleTestConnection}
            disabled={testStatus === 'testing'}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${testStatus === 'testing' ? 'animate-spin' : ''}`} />
            <span>Test Connection</span>
          </button>
        </div>

        {testStatus !== 'idle' && (
          <div className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
            testStatus === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : testStatus === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-slate-50 border-slate-200 text-slate-700'
          }`}>
            {testStatus === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : testStatus === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            ) : (
              <RefreshCw className="w-4 h-4 text-slate-600 animate-spin shrink-0 mt-0.5" />
            )}
            <div>{testMessage}</div>
          </div>
        )}
      </div>

      {/* Backend Code Scaffolding Snippet */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-slate-600" />
            <span className="text-xs font-bold text-slate-700">Sample Express / Node Backend Proxy</span>
          </div>
          <button
            onClick={copyToClipboard}
            className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>{copiedSnippet ? 'Copied!' : 'Copy Code'}</span>
          </button>
        </div>

        <pre className="bg-slate-950 text-slate-200 p-4 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed border border-slate-800">
          {SAMPLE_EXPRESS_CODE}
        </pre>
      </div>
    </div>
  );
};
