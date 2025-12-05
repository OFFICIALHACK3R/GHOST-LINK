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
  const [bootSequence, setBootSequence] = useState<string[]>([]);
  
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
    setContacts(prev => {
        if(prev.find(c => c.id === AI_CONTACT_ID)) return prev;
        return [AI_CONTACT, ...prev];
    });
    setCurrentView('dashboard');
  };

  const handleCreateIdentity = async () => {
    setIsGenerating(true);
    
    // Matrix boot sequence simulation
    const steps = [
        "INITIALIZING KERNEL...",
        "ALLOCATING MEMORY BLOCKS...",
        "GENERATING 2048-BIT RSA KEY PAIR...",
        "ENCRYPTING LOCAL STORE...",
        "ESTABLISHING SECURE SOCKET...",
        "ACCESS GRANTED."
    ];
    
    for (let i = 0; i < steps.length; i++) {
        setBootSequence(prev => [...prev, steps[i]]);
        await new Promise(r => setTimeout(r, 400));
    }

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
    }, 500);
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
      setTimeout(async () => {
        const chatHistory = messages
            .filter(m => (m.senderId === identity.fingerprint && m.receiverId === AI_CONTACT_ID) || (m.senderId === AI_CONTACT_ID && m.receiverId === identity.fingerprint));
        
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
      }, 600);
    } else {
        setTimeout(() => {
            const reply: Message = {
                id: crypto.randomUUID(),
                senderId: activeChatId,
                receiverId: identity.fingerprint,
                content: "AUTO_REPLY: UPLINK ESTABLISHED. ACKNOWLEDGED.",
                timestamp: Date.now(),
                status: 'delivered'
            };
             setMessages(prev => [...prev, reply]);
        }, 2000);
    }
  };

  const handleAddContact = () => {
    if(!addContactCode.trim()) return;
    const mockId = addContactCode.replace('-', '').substring(0, 8);
    
    const newContact: Contact = {
        id: mockId,
        publicKey: 'mock-pub-key',
        name: `NODE_${mockId}`,
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
      lastMessagePreview: lastMsg ? lastMsg.content : 'AWAITING_INPUT',
      lastMessageTimestamp: lastMsg ? lastMsg.timestamp : Date.now(),
      unreadCount: 0 
    };
  };

  const formatTime = (ts: number) => {
    return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: 'numeric', hour12: false }).format(new Date(ts));
  };

  // --- Views ---

  if (currentView === 'onboarding') {
    return (
      <div className="min-h-screen bg-hacker-950 flex flex-col items-center justify-center p-6 text-center font-mono relative">
        <div className="border border-hacker-500/30 p-12 bg-hacker-900/80 shadow-[0_0_50px_rgba(0,255,65,0.1)] max-w-lg w-full">
            <div className="mb-8 flex justify-center">
              <Icons.Shield className="w-20 h-20 text-hacker-500 animate-pulse" strokeWidth={1} />
            </div>
            
            <h1 className="text-5xl font-bold text-hacker-500 mb-2 tracking-tighter glitch" style={{textShadow: '0 0 10px rgba(0,255,65,0.5)'}}>ZER0_TRACE</h1>
            <div className="h-px w-full bg-hacker-500/50 mb-6"></div>
            
            {!isGenerating ? (
                <>
                    <p className="text-hacker-100 mb-8 text-sm leading-relaxed">
                      ANONYMOUS ENCRYPTED UPLINK<br/>
                      <span className="text-hacker-500">NO LOGS. NO TRACE. NO FEAR.</span>
                    </p>
                    <Button onClick={handleCreateIdentity} size="lg" className="w-full shadow-[0_0_15px_rgba(0,255,65,0.4)] animate-pulse-fast">
                      <Icons.Cpu className="w-5 h-5 mr-3" />
                      INITIATE SEQUENCE
                    </Button>
                </>
            ) : (
                <div className="text-left font-mono text-xs text-hacker-500 space-y-1 h-48 overflow-hidden">
                    {bootSequence.map((line, i) => (
                        <div key={i}>&gt; {line}</div>
                    ))}
                    <div className="animate-pulse">&gt; _</div>
                </div>
            )}
            
            <div className="mt-12 text-[10px] text-hacker-600 tracking-widest border-t border-hacker-800 pt-4">
                PRODUCED BY <span className="text-hacker-500 font-bold">MAC8 INDUSTRIES</span>
            </div>
        </div>
      </div>
    );
  }

  // Common Layout for Dashboard/Chat
  return (
    <div className="min-h-screen bg-black flex justify-center font-mono text-hacker-500">
      <div className="w-full max-w-md bg-hacker-900 h-screen flex flex-col relative shadow-[0_0_50px_rgba(0,255,65,0.05)] border-x border-hacker-800">
        
        {/* Header */}
        <header className="h-14 border-b border-hacker-600 flex items-center justify-between px-4 bg-hacker-950/90 backdrop-blur z-20 sticky top-0">
          {activeChatId ? (
            <div className="flex items-center w-full">
              <Button variant="secondary" size="sm" onClick={() => setActiveChatId(null)} className="mr-3 border-none !p-0 hover:bg-transparent">
                 &lt; BACK
              </Button>
              <div className="flex-1 flex items-center justify-end">
                 <div className="text-right mr-3">
                   <h3 className="font-bold text-hacker-100 text-sm uppercase tracking-wider">
                     {contacts.find(c => c.id === activeChatId)?.name}
                   </h3>
                   <p className="text-[10px] text-hacker-500 flex items-center justify-end">
                     SECURE_CONN_ESTABLISHED <Icons.Lock size={8} className="ml-1" /> 
                   </p>
                </div>
                <div className={`w-8 h-8 border border-hacker-500 flex items-center justify-center bg-hacker-900`}>
                    {activeChatId === AI_CONTACT_ID ? <Icons.Cpu size={16}/> : <Icons.User size={16}/>}
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center">
                  <Icons.Shield className="w-5 h-5 text-hacker-500 mr-2" />
                  <span className="font-bold tracking-widest text-lg text-hacker-100">ZER0_TRACE</span>
              </div>
              <Button variant="secondary" size="sm" onClick={() => setShowAddContact(!showAddContact)}>
                <Icons.Plus className="w-4 h-4" />
              </Button>
            </>
          )}
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto relative scroll-smooth bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]">
          {activeChatId ? (
            // CHAT VIEW
            <div className="min-h-full flex flex-col p-4 space-y-4">
               {messages
                .filter(m => (m.senderId === identity?.fingerprint && m.receiverId === activeChatId) || (m.senderId === activeChatId && m.receiverId === identity?.fingerprint))
                .map((msg) => {
                 const isMe = msg.senderId === identity?.fingerprint;
                 return (
                   <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] p-3 text-sm border ${
                        isMe 
                        ? 'bg-hacker-900 border-hacker-500 text-hacker-100 ml-4' 
                        : 'bg-black border-hacker-700 text-hacker-500 mr-4'
                      }`}>
                        <div className="text-[9px] mb-1 opacity-50 uppercase tracking-widest">
                            {isMe ? 'YOU' : contacts.find(c => c.id === activeChatId)?.name} // {formatTime(msg.timestamp)}
                        </div>
                        <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
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
                 <div className="bg-black p-4 border border-hacker-500 mb-4 shadow-[0_0_10px_rgba(0,255,65,0.1)]">
                    <h3 className="text-xs font-bold text-hacker-500 mb-2 uppercase tracking-widest">>> Link_New_Node</h3>
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            placeholder="ENTER_TARGET_CODE"
                            className="flex-1 bg-hacker-900 border border-hacker-600 px-3 py-2 text-sm focus:border-hacker-500 outline-none text-hacker-100 placeholder-hacker-700 font-mono uppercase"
                            value={addContactCode}
                            onChange={(e) => setAddContactCode(e.target.value.toUpperCase())}
                        />
                        <Button size="sm" onClick={handleAddContact}>CONNECT</Button>
                    </div>
                 </div>
              )}

              {/* My Code Card */}
              <div className="bg-hacker-900 p-6 border border-hacker-500 relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-2 opacity-20">
                    <Icons.Fingerprint size={100} className="text-hacker-500" />
                 </div>
                 <h2 className="text-xs font-bold text-hacker-600 uppercase tracking-widest mb-2">[ LOCAL_NODE_IDENTITY ]</h2>
                 <div className="flex items-center justify-between mt-2 z-10 relative">
                    <div className="font-mono text-3xl text-hacker-100 tracking-wider font-bold shadow-green-glow">
                        {linkCode || '....-....'}
                    </div>
                    <Button variant="secondary" size="sm" onClick={() => navigator.clipboard.writeText(linkCode)}>
                        <Icons.Copy className="w-4 h-4" />
                    </Button>
                 </div>
                 <div className="mt-4 flex items-center text-[10px] text-hacker-500 border-t border-hacker-800 pt-2">
                    <span className="w-2 h-2 bg-hacker-500 mr-2 animate-pulse"></span>
                    KEY_ROTATION_TIMER: 14:23:01
                 </div>
              </div>

              {/* Contacts List */}
              <div>
                <h3 className="text-xs font-bold text-hacker-600 uppercase tracking-widest mb-3 px-1 border-b border-hacker-800 pb-1 flex justify-between">
                    <span>Active_Nodes</span>
                    <span>{contacts.length}</span>
                </h3>
                <div className="space-y-2">
                  {contacts.map(contact => {
                    const session = getChatSession(contact.id);
                    return (
                        <div 
                            key={contact.id}
                            onClick={() => setActiveChatId(contact.id)}
                            className="flex items-center p-3 border border-hacker-800 hover:border-hacker-500 hover:bg-hacker-800/50 transition-all cursor-pointer group bg-black/50"
                        >
                            <div className={`w-10 h-10 border flex items-center justify-center mr-4 ${contact.isAi ? 'border-hacker-500 text-hacker-500' : 'border-hacker-700 text-hacker-700 group-hover:text-hacker-400 group-hover:border-hacker-400'}`}>
                                {contact.isAi ? <Icons.Cpu size={20} /> : <Icons.User size={20} />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-baseline mb-1">
                                    <h4 className="font-bold text-hacker-100 truncate text-sm tracking-wide">{contact.name}</h4>
                                    <span className="text-[10px] text-hacker-600 font-mono">{session.lastMessageTimestamp ? formatTime(session.lastMessageTimestamp) : ''}</span>
                                </div>
                                <p className="text-xs text-hacker-500/70 truncate pr-4 font-mono">
                                    <span className="mr-2 opacity-50">&gt;</span>
                                    {session.lastMessagePreview}
                                </p>
                            </div>
                        </div>
                    )
                  })}
                </div>
              </div>
              
               <div className="mt-8 text-center">
                    <p className="text-[9px] text-hacker-700 tracking-[0.2em]">MAC8 INDUSTRIES ENCRYPTION LAYER V4.0</p>
               </div>

            </div>
          )}
        </main>

        {/* Input Area (Only in Chat) */}
        {activeChatId && (
          <footer className="p-3 bg-hacker-950 border-t border-hacker-600">
             <form 
                onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
                className="flex items-end gap-2"
             >
                <div className="flex-1 bg-black border border-hacker-600 focus-within:border-hacker-500 transition-colors flex items-center px-3 py-2">
                    <span className="text-hacker-500 mr-2 text-xs">&gt;</span>
                    <input
                        className="bg-transparent w-full text-hacker-100 placeholder-hacker-800 text-sm outline-none font-mono"
                        placeholder="ENTER_PAYLOAD..."
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        autoFocus
                    />
                </div>
                <Button 
                    type="submit" 
                    variant="primary" 
                    size="sm"
                    className="h-10 w-12 !px-0 flex items-center justify-center"
                    disabled={!inputText.trim()}
                >
                    <Icons.Send size={16} />
                </Button>
             </form>
          </footer>
        )}

      </div>
    </div>
  );
}

export default App;