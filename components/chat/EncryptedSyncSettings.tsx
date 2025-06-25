import { useSignal, useComputed } from '@preact/signals';
import { useEffect } from 'preact/hooks';
import { IconInfoCircleFilled, IconCopy, IconQrcode, IconKey, IconUsers, IconShield, IconLoader2 } from '@tabler/icons-preact';
import { useChatSync } from '../../lib/sync/useChatSync.ts';
import Input from '../core/Input.tsx';
import { Button } from '../Button.tsx';
import QRCode from 'qrcode';

export function EncryptedSyncSettings() {
  const { getSettings, saveSettings, generateShareableLink, generateQRCode, getSyncState } = useChatSync();
  const settings = useSignal(getSettings());
  const showQRCode = useSignal(false);
  const newPeerKey = useSignal('');
  const copySuccess = useSignal('');
  const syncState = useSignal(getSyncState());
  const qrCodeImage = useSignal('');
  const isInitializingKey = useSignal(false);

  // Update sync state periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const newState = getSyncState();
      if (settings.value.enabled && !syncState.value.publicKey && !newState.publicKey) {
        isInitializingKey.value = true;
      } else if (newState.publicKey) {
        isInitializingKey.value = false;
      }
      syncState.value = newState;
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Initialize key generation when sync is enabled
  useEffect(() => {
    if (settings.value.enabled && !syncState.value.publicKey) {
      isInitializingKey.value = true;
    }
  }, [settings.value.enabled]);

  const publicKey = useComputed(() => syncState.value.publicKey);
  const shareableLink = useComputed(() => {
    try {
      return publicKey.value ? generateShareableLink() : '';
    } catch {
      return '';
    }
  });

  const qrCodeData = useComputed(() => {
    try {
      return publicKey.value ? generateQRCode() : '';
    } catch {
      return '';
    }
  });

  // Generate QR code image when data changes
  useEffect(() => {
    if (qrCodeData.value && showQRCode.value) {
      QRCode.toDataURL(qrCodeData.value, { width: 200, margin: 2 })
        .then((url: string) => {
          qrCodeImage.value = url;
        })
        .catch((err: unknown) => {
          console.error('QR code generation failed:', err);
          qrCodeImage.value = '';
        });
    }
  }, [qrCodeData.value, showQRCode.value]);

  const handleToggleSync = (enabled: boolean) => {
    const newSettings = { ...settings.value, enabled };
    settings.value = newSettings;
    saveSettings(newSettings);
  };

  const handleUserNameChange = (userName: string) => {
    const newSettings = { ...settings.value, userName };
    settings.value = newSettings;
    saveSettings(newSettings);
  };

  const handleAddPeer = async () => {
    const peerKey = newPeerKey.value.trim();
    if (!peerKey) return;

    try {
      // Validate the peer key format
      if (peerKey.startsWith('http')) {
        // Extract public key from URL
        const url = new URL(peerKey);
        const publicKeyParam = url.searchParams.get('publicKey');
        if (publicKeyParam) {
          const newSettings = {
            ...settings.value,
            peerPublicKeys: [...settings.value.peerPublicKeys, publicKeyParam]
          };
          settings.value = newSettings;
          saveSettings(newSettings);
        }
      } else if (peerKey.startsWith('{')) {
        // Parse QR code JSON
        const qrData = JSON.parse(peerKey);
        if (qrData.type === 'school-bud-e-sync' && qrData.publicKey) {
          const newSettings = {
            ...settings.value,
            peerPublicKeys: [...settings.value.peerPublicKeys, qrData.publicKey]
          };
          settings.value = newSettings;
          saveSettings(newSettings);
        }
      } else {
        // Assume it's a raw public key
        const newSettings = {
          ...settings.value,
          peerPublicKeys: [...settings.value.peerPublicKeys, peerKey]
        };
        settings.value = newSettings;
        saveSettings(newSettings);
      }
      
      newPeerKey.value = '';
    } catch (error) {
      console.error('Invalid peer key format:', error);
    }
  };

  const handleRemovePeer = (peerKey: string) => {
    const newSettings = {
      ...settings.value,
      peerPublicKeys: settings.value.peerPublicKeys.filter(key => key !== peerKey)
    };
    settings.value = newSettings;
    saveSettings(newSettings);
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      copySuccess.value = `${type} copied!`;
      setTimeout(() => copySuccess.value = '', 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-l-4 border-blue-500 p-4 rounded bg-gray-200">
        <div className="flex">
          <div className="flex-shrink-0">
            <IconShield className="h-5 w-5 text-blue-500" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Encrypted P2P Chat Sync
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>Securely sync your chats using end-to-end encryption. Share your public key with trusted peers to enable secure synchronization.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Enable Toggle */}
      <div>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={settings.value.enabled}
            onChange={(e: Event) => handleToggleSync((e.target as HTMLInputElement).checked)}
            className="rounded border-gray-300 text-primary-600 focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
          />
          <span className="ml-2 text-sm font-medium text-gray-700">
            Enable Encrypted Chat Synchronization
          </span>
        </label>
      </div>

      {settings.value.enabled && (
        <>
          {/* User Settings */}
          <div>
            <label htmlFor="userName" className="block text-sm font-medium text-gray-700 mb-1">
              <IconUsers className="inline h-4 w-4 mr-1" />
              Display Name
            </label>
            <Input
              type="text"
              id="userName"
              value={settings.value.userName}
              onChange={(e: Event) => handleUserNameChange((e.target as HTMLInputElement).value)}
              className="focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
              placeholder="Your name"
            />
            <p className="mt-1 text-sm text-gray-500">
              Your display name for other users in the sync group
            </p>
          </div>

          {/* Your Public Key */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <IconKey className="inline h-4 w-4 mr-1" />
              Your Public Key
            </label>
            {publicKey.value ? (
              <div className="space-y-3">
                <div className="bg-gray-50 p-3 rounded-md border">
                  <code className="text-xs text-gray-800 break-all">
                    {publicKey.value}
                  </code>
                </div>
                
                <div className="flex space-x-2">
                  <Button
                    onClick={() => copyToClipboard(publicKey.value!, 'Public key')}
                    className="flex items-center space-x-1 text-sm"
                    variant="secondary"
                  >
                    <IconCopy className="h-4 w-4" />
                    <span>Copy Key</span>
                  </Button>
                  
                  <Button
                    onClick={() => copyToClipboard(shareableLink.value, 'Shareable link')}
                    className="flex items-center space-x-1 text-sm"
                    variant="secondary"
                  >
                    <IconCopy className="h-4 w-4" />
                    <span>Copy Link</span>
                  </Button>
                  
                  <Button
                    onClick={() => showQRCode.value = !showQRCode.value}
                    className="flex items-center space-x-1 text-sm"
                    variant="secondary"
                  >
                    <IconQrcode className="h-4 w-4" />
                    <span>QR Code</span>
                  </Button>
                </div>

                {showQRCode.value && (
                  <div className="bg-white p-4 rounded-lg border text-center">
                    <p className="text-sm text-gray-600 mb-3">
                      Scan this QR code to add as peer:
                    </p>
                    {qrCodeImage.value ? (
                      <div className="flex flex-col items-center space-y-3">
                        <img 
                          src={qrCodeImage.value} 
                          alt="QR Code for peer connection" 
                          className="border rounded"
                        />
                        <div className="text-xs text-gray-500">
                          Or copy the data manually:
                        </div>
                        <div className="bg-gray-50 p-2 rounded border max-w-full">
                          <code className="text-xs text-gray-800 break-all">
                            {qrCodeData.value}
                          </code>
                        </div>
                        <Button
                          onClick={() => copyToClipboard(qrCodeData.value, 'QR code data')}
                          className="text-sm"
                          variant="secondary"
                        >
                          Copy QR Data
                        </Button>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500">
                        Generating QR code...
                      </div>
                    )}
                  </div>
                )}

                {copySuccess.value && (
                  <div className="text-sm text-green-600 font-medium">
                    {copySuccess.value}
                  </div>
                )}
              </div>
            ) : isInitializingKey.value ? (
              <div className="space-y-3">
                {/* Key skeleton with spinner */}
                <div className="bg-gray-50 p-3 rounded-md border">
                  <div className="flex items-center space-x-2">
                    <IconLoader2 className="h-4 w-4 animate-spin text-gray-400" />
                    <div className="text-sm text-gray-500">Generating secure key pair...</div>
                  </div>
                  <div className="mt-2 bg-gray-200 rounded h-12 animate-pulse"></div>
                </div>

                {/* Button skeleton to prevent CLS */}
                <div className="flex space-x-2">
                  <div className="bg-gray-200 h-8 w-20 rounded animate-pulse"></div>
                  <div className="bg-gray-200 h-8 w-24 rounded animate-pulse"></div>
                  <div className="bg-gray-200 h-8 w-20 rounded animate-pulse"></div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-500">
                Public key will be generated when sync is initialized
              </div>
            )}
          </div>

          {/* Add Peer */}
          <div>
            <label htmlFor="newPeerKey" className="block text-sm font-medium text-gray-700 mb-1">
              Add Peer
            </label>
            <div className="flex space-x-2">
              <Input
                type="text"
                id="newPeerKey"
                value={newPeerKey.value}
                onChange={(e: Event) => newPeerKey.value = (e.target as HTMLInputElement).value}
                className="flex-1 focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                placeholder="Paste public key, shareable link, or QR code data"
              />
              <Button
                onClick={handleAddPeer}
                disabled={!newPeerKey.value.trim()}
                className="text-sm"
              >
                Add
              </Button>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Add a peer's public key, shareable link, or QR code data to enable encrypted sync
            </p>
          </div>

          {/* Connected Peers */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Authorized Peers ({settings.value.peerPublicKeys.length})
            </h3>
            {settings.value.peerPublicKeys.length > 0 ? (
              <div className="space-y-2">
                {settings.value.peerPublicKeys.map((peerKey, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-md border">
                    <code className="text-xs text-gray-800 break-all flex-1 mr-3">
                      {peerKey.substring(0, 32)}...{peerKey.substring(peerKey.length - 8)}
                    </code>
                    <Button
                      onClick={() => handleRemovePeer(peerKey)}
                      variant="secondary"
                      className="text-xs text-red-600 hover:text-red-800"
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-md border">
                No peers added yet. Add peer public keys to enable encrypted sync.
              </div>
            )}
          </div>

          {/* Sync Status */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-800 mb-2">Sync Status</h3>
            <div className="space-y-2">
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full ${syncState.value.connected ? 'bg-green-500' : 'bg-red-500'} mr-2`}></div>
                <span className="text-sm text-gray-600">
                  {syncState.value.connected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full ${syncState.value.encrypted ? 'bg-blue-500' : 'bg-gray-400'} mr-2`}></div>
                <span className="text-sm text-gray-600">
                  {syncState.value.encrypted ? 'Encrypted' : 'Not Encrypted'}
                </span>
              </div>
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full ${syncState.value.peers > 0 ? 'bg-green-500' : 'bg-gray-400'} mr-2`}></div>
                <span className="text-sm text-gray-600">
                  {syncState.value.peers} peer{syncState.value.peers !== 1 ? 's' : ''} connected
                </span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
} 