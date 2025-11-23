// Simple state + flow helper for the simulation
window.Sim = (function(){
  const store = {
    set(key, val){ sessionStorage.setItem(key, val); },
    get(key){ return sessionStorage.getItem(key); },
    del(key){ sessionStorage.removeItem(key); }
  };

  const flow = {
    // Define where to go after selecting an objective
    Engagement: { nextAfterObjective: 'engagement-setup.html' },
    Traffic: { nextAfterObjective: 'index.html' }, // placeholders for future
    Awareness: { nextAfterObjective: 'index.html' },
    Leads: { nextAfterObjective: 'index.html' },
    AppPromotions: { nextAfterObjective: 'index.html' },
    Sales: { nextAfterObjective: 'index.html' },
  };

  function nextAfterObjective(objective){
    const f = flow[objective];
    return (f && f.nextAfterObjective) || 'index.html';
  }

  return {
    setObjective: (v)=> store.set('objective', v),
    getObjective: ()=> store.get('objective'),
    setBuyingType: (v)=> store.set('buyingType', v),
    getBuyingType: ()=> store.get('buyingType') || 'Auction',
    nextAfterObjective,
    goto: (path)=> { window.location.href = path; },
  };
})();

