import React, { useState, useEffect, useRef } from 'react';
import { generateKeyPair, generateFingerprint, generateDailyLinkCode } from './services/cryptoService';
import { generateAIResponse } from './services/geminiService';
import { UserIdentity, Contact, Message, ChatSession } from './types';
import { AI_CONTACT, AI_CONTACT_ID } from './constants';
import { Button } from './components/Button';
import { Icons } from './components/Icon';

// Views
type View = 'onboarding' | 'dashboard' | 'chat';

function App() {
  // Application State
  const [identity, setIdentity] = useState<UserIdentity | null>(null);
  const [linkCode, setLinkCode] = useState<string>('');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<View>('onboarding');
  
  // UI State
  const [isGenerating, setIsGenerating] = useState(false);
  const [inputText, setInputText] = useState('');
  const [addContactCode, setAddContactCode] = useState('');
  const [showAddContact, setShowAddContact] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load identity from storage on mount
  useEffect(() => {
    const storedIdentity = localStorage.getItem('ghostlink_identity');
    if (storedIdentity) {
      const parsed = JSON.parse(storedIdentity);
      setIdentity(parsed);
      loadDashboard(parsed);
    }
  }, []);

  // Update link code periodically
  useEffect(() => {
    if (identity) {
      generateDailyLinkCode(identity.publicKey).then(setLinkCode);
    }
  }, [identity]);

  // Scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeChatId]);

  const loadDashboard = async (user: UserIdentity) => {
    // In a real app, this would load from IndexedDB
    // For demo, we ensure the AI contact exists
    setContacts(prev => {
        if(prev.find(c => c.id === AI_CONTACT_ID)) return prev;
        return [AI_CONTACT, ...prev];
    });
    setCurrentView('dashboard');
  };

  const handleCreateIdentity = async () => {
    setIsGenerating(true);
    // Simulate complex crypto work time
    setTimeout(async () => {
      const keyPair = await generateKeyPair();
      const fingerprint = await generateFingerprint(keyPair.publicKey);
      
      const newIdentity: UserIdentity = {
        ...keyPair,
        fingerprint,
        createdAt: Date.now(),
      };
      
      localStorage.setItem('ghostlink_identity', JSON.stringify(newIdentity));
      setIdentity(newIdentity);
      loadDashboard(newIdentity);
      setIsGenerating(false);
    }, 1500);
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || !activeChatId || !identity) return;

    const newMessage: Message = {
      id: crypto.randomUUID(),
      senderId: identity.fingerprint,
      receiverId: activeChatId,
      content: inputText,
      timestamp: Date.now(),
      status: 'sent',
    };

    setMessages(prev => [...prev, newMessage]);
    setInputText('');

    // Handle AI Response
    if (activeChatId === AI_CONTACT_ID) {
      // Simulate network delay
      setTimeout(async () => {
        // Set typing indicator or similar here if desired
        
        // Get conversation history for this chat
        const chatHistory = messages
            .filter(m => (m.senderId === identity.fingerprint && m.receiverId === AI_CONTACT_ID) || (m.senderId === AI_CONTACT_ID && m.receiverId === identity.fingerprint));
        
        // Include the new message in history context
        const context = [...chatHistory, newMessage];
        
        const responseText = await generateAIResponse(context, newMessage.content);
        
        const aiMessage: Message = {
          id: crypto.randomUUID(),
          senderId: AI_CONTACT_ID,
          receiverId: identity.fingerprint,
          content: responseText,
          timestamp: Date.now(),
          status: 'delivered',
          isAiResponse: true,
        };
        
        setMessages(prev => [...prev, aiMessage]);
      }, 600); // Small delay for realism
    } else {
        // Mock reply for other contacts (since this is a single client demo)
        setTimeout(() => {
            const reply: Message = {
                id: crypto.randomUUID(),
                senderId: activeChatId,
                receiverId: identity.fingerprint,
                content: "Auto-reply: This is a demo. Message received via simulated E2EE.",
                timestamp: Date.now(),
                status: 'delivered'
            };
             setMessages(prev => [...prev, reply]);
        }, 2000);
    }
  };

  const handleAddContact = () => {
    if(!addContactCode.trim()) return;
    
    // In a real app, this would query the server to find the pubkey associated with the code
    // For demo, we just create a Mock Contact
    const mockId = addContactCode.replace('-', '').substring(0, 8);
    
    const newContact: Contact = {
        id: mockId,
        publicKey: 'mock-pub-key',
        name: `Contact ${mockId}`,
        isAi: false,
        avatarSeed: mockId
    };
    
    setContacts(prev => [...prev, newContact]);
    setAddContactCode('');
    setShowAddContact(false);
  };

  const getChatSession = (contactId: string): ChatSession => {
    const chatMessages = messages.filter(m => 
      (m.senderId === identity?.fingerprint && m.receiverId === contactId) ||
      (m.senderId === contactId && m.receiverId === identity?.fingerprint)
    ).sort((a,b) => b.timestamp - a.timestamp);

    const lastMsg = chatMessages[0];

    return {
      contactId,
      lastMessagePreview: lastMsg ? lastMsg.content : 'No messages yet',
      lastMessageTimestamp: lastMsg ? lastMsg.timestamp : Date.now(),
      unreadCount: 0 // logic for unread would go here
    };
  };

  const formatTime = (ts: number) => {
    return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }).format(new Date(ts));
  };

  // --- Views ---

  if (currentView === 'onboarding') {
    return (
      <div className="min-h-screen bg-ghost-900 flex flex-col items-center justify-center p-6 text-center">
        <div className="mb-8 relative">
          <div className="absolute inset-0 bg-ghost-500 blur-3xl opacity-20 rounded-full animate-pulse"></div>
          <Icons.Shield className="w-24 h-24 text-ghost-500 relative z-10" />
        </div>
        
        <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">GhostLink</h1>
        <p className="text-ghost-400 max-w-md mb-12 text-lg">
          Zero knowledge. End-to-end encrypted. Anonymous. <br/>
          Your identity is a cryptographic key, not a phone number.
        </p>
        
        {isGenerating ? (
          <div className="flex flex-col items-center space-y-4">
             <Icons.Refresh className="w-8 h-8 text-ghost-500 animate-spin" />
             <p className="text-ghost-400 font-mono text-sm">Generating 2048-bit RSA Key Pair...</p>
             <p className="text-ghost-600 font-mono text-xs">Deriving Fingerprint...</p>
          </div>
        ) : (
          <Button onClick={handleCreateIdentity} size="lg" className="shadow-[0_0_20px_rgba(16,185,129,0.3)]">
            <Icons.Key className="w-5 h-5 mr-2" />
            Create Anonymous Identity
          </Button>
        )}
      </div>
    );
  }

  // Common Layout for Dashboard/Chat
  return (
    <div className="min-h-screen bg-ghost-900 flex justify-center">
      <div className="w-full max-w-md bg-ghost-900 h-screen flex flex-col relative shadow-2xl overflow-hidden border-x border-ghost-800">
        
        {/* Header */}
        <header className="h-16 border-b border-ghost-800 flex items-center justify-between px-4 bg-ghost-900/95 backdrop-blur z-20 sticky top-0">
          {activeChatId ? (
            <div className="flex items-center w-full">
              <Button variant="ghost" size="sm" onClick={() => setActiveChatId(null)} className="mr-2 -ml-2">
                 ←
              </Button>
              <div className="flex-1 flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${activeChatId === AI_CONTACT_ID ? 'bg-ghost-500/20 text-ghost-500' : 'bg-indigo-500/20 text-indigo-400'}`}>
                    {activeChatId === AI_CONTACT_ID ? <Icons.Cpu size={16}/> : <Icons.User size={16}/>}
                </div>
                <div>
                   <h3 className="font-medium text-white text-sm">
                     {contacts.find(c => c.id === activeChatId)?.name}
                   </h3>
                   <p className="text-xs text-ghost-500 flex items-center">
                     <Icons.Lock size={10} className="mr-1" /> Encrypted
                   </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center">
                  <Icons.Shield className="w-6 h-6 text-ghost-500 mr-2" />
                  <span className="font-bold tracking-wider text-lg">GHOSTLINK</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowAddContact(!showAddContact)}>
                <Icons.Plus className="w-5 h-5" />
              </Button>
            </>
          )}
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto relative scroll-smooth">
          {activeChatId ? (
            // CHAT VIEW
            <div className="min-h-full flex flex-col p-4 space-y-4">
               {messages
                .filter(m => (m.senderId === identity?.fingerprint && m.receiverId === activeChatId) || (m.senderId === activeChatId && m.receiverId === identity?.fingerprint))
                .map((msg) => {
                 const isMe = msg.senderId === identity?.fingerprint;
                 return (
                   <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-md ${
                        isMe 
                        ? 'bg-ghost-500 text-ghost-900 rounded-br-none' 
                        : 'bg-ghost-800 text-ghost-100 rounded-bl-none border border-ghost-700'
                      }`}>
                        <p>{msg.content}</p>
                        <div className={`text-[10px] mt-1 flex items-center justify-end ${isMe ? 'text-ghost-800/70' : 'text-ghost-400'}`}>
                          {formatTime(msg.timestamp)}
                          {isMe && <Icons.DoubleCheck size={12} className="ml-1 opacity-75" />}
                        </div>
                      </div>
                   </div>
                 );
               })}
               <div ref={messagesEndRef} />
            </div>
          ) : (
            // DASHBOARD VIEW
            <div className="p-4 space-y-6">
              
              {/* Add Contact Collapsible */}
              {showAddContact && (
                 <div className="bg-ghost-800 p-4 rounded-xl border border-ghost-700 mb-4 animate-in fade-in slide-in-from-top-4">
                    <h3 className="text-sm font-medium text-ghost-400 mb-2">Link with a new contact</h3>
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            placeholder="Enter 24h Link Code (e.g. ABCD-1234)"
                            className="flex-1 bg-ghost-900 border border-ghost-700 rounded-lg px-3 py-2 text-sm focus:border-ghost-500 outline-none uppercase placeholder:normal-case"
                            value={addContactCode}
                            onChange={(e) => setAddContactCode(e.target.value.toUpperCase())}
                        />
                        <Button size="sm" onClick={handleAddContact}>Link</Button>
                    </div>
                 </div>
              )}

              {/* My Code Card */}
              <div className="bg-gradient-to-br from-ghost-800 to-ghost-900 rounded-xl p-6 border border-ghost-700 shadow-lg relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Icons.Fingerprint size={80} />
                 </div>
                 <h2 className="text-xs font-semibold text-ghost-400 uppercase tracking-widest mb-1">My 24h Link Code</h2>
                 <div className="flex items-center justify-between mt-2">
                    <div className="font-mono text-3xl text-ghost-100 tracking-wider font-bold">
                        {linkCode || '....-....'}
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => navigator.clipboard.writeText(linkCode)}>
                        <Icons.Copy className="w-5 h-5 text-ghost-500" />
                    </Button>
                 </div>
                 <div className="mt-4 flex items-center text-xs text-ghost-500">
                    <div className="w-2 h-2 rounded-full bg-ghost-500 mr-2 animate-pulse"></div>
                    Auto-rotates in 14h 23m
                 </div>
              </div>

              {/* Contacts List */}
              <div>
                <h3 className="text-xs font-semibold text-ghost-500 uppercase tracking-widest mb-3 px-1">Secure Links</h3>
                <div className="space-y-1">
                  {contacts.map(contact => {
                    const session = getChatSession(contact.id);
                    return (
                        <div 
                            key={contact.id}
                            onClick={() => setActiveChatId(contact.id)}
                            className="flex items-center p-3 rounded-lg hover:bg-ghost-800 transition-colors cursor-pointer group"
                        >
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 shadow-inner ${contact.isAi ? 'bg-gradient-to-tr from-ghost-600 to-ghost-500 text-white' : 'bg-ghost-700 text-ghost-400'}`}>
                                {contact.isAi ? <Icons.Cpu size={24} /> : <Icons.User size={24} />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-baseline mb-1">
                                    <h4 className="font-medium text-ghost-100 truncate group-hover:text-ghost-50 transition-colors">{contact.name}</h4>
                                    <span className="text-[10px] text-ghost-500">{session.lastMessageTimestamp ? formatTime(session.lastMessageTimestamp) : ''}</span>
                                </div>
                                <p className="text-sm text-ghost-400 truncate pr-4">
                                    {contact.isAi && <span className="text-ghost-500 mr-1">Bot:</span>}
                                    {session.lastMessagePreview}
                                </p>
                            </div>
                        </div>
                    )
                  })}
                  {contacts.length === 0 && (
                     <div className="text-center py-8 text-ghost-600 text-sm">
                        No links yet. Share your code to connect.
                     </div>
                  )}
                </div>
              </div>

            </div>
          )}
        </main>

        {/* Input Area (Only in Chat) */}
        {activeChatId && (
          <footer className="p-3 bg-ghost-900 border-t border-ghost-800">
             <form 
                onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
                className="flex items-end gap-2"
             >
                <div className="flex-1 bg-ghost-800 rounded-2xl border border-ghost-700 focus-within:border-ghost-500 transition-colors flex items-center px-4 py-2">
                    <input
                        className="bg-transparent w-full text-ghost-100 placeholder-ghost-500 text-sm outline-none max-h-24"
                        placeholder="Message..."
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        autoFocus
                    />
                </div>
                <Button 
                    type="submit" 
                    variant="primary" 
                    className="rounded-full w-10 h-10 !p-0 flex items-center justify-center shadow-lg shadow-ghost-500/20"
                    disabled={!inputText.trim()}
                >
                    <Icons.Send size={18} />
                </Button>
             </form>
          </footer>
        )}

      </div>
    </div>
  );
}

export default App;